import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { QRCodeCanvas } from "qrcode.react";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function UploadPage() {
  const [link, setLink] = useState("");
  const [quizUrl, setQuizUrl] = useState("");
  const [error, setError] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

    if (rows.length < 2) {
      setError("File vuoto o formattato male.");
      return;
    }

    const quiz: QuizQuestion[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 6) continue;
      const [q, a, b, c, d, correct] = row;
      quiz.push({
        question: q.trim(),
        options: [a, b, c, d].map((x) => x.trim()),
        correctAnswer: correct.trim().toUpperCase(),
      });
    }

    if (quiz.length === 0) {
      setError("Nessuna domanda valida trovata.");
      return;
    }

    const id = uuidv4().slice(0, 6);
    try {
      const res = await fetch(`/api/save?id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz),
      });

      if (!res.ok) throw new Error("Errore nel salvataggio");

      const fullUrl = `${window.location.origin}/quiz/${id}`;
      setLink(`/quiz/${id}`);
      setQuizUrl(fullUrl);
    } catch (err) {
      console.error(err);
      setError("Errore nel salvataggio del quiz.");
    }
  };

  const handleCopy = () => {
    if (quizUrl) navigator.clipboard.writeText(quizUrl);
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "qr-code.png";
    downloadLink.click();
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "2rem" }}>
      <h1>Upload Quiz Excel</h1>
      <input type="file" accept=".xlsx" onChange={handleFile} />

      {link && (
        <div style={{ marginTop: "2rem" }}>
          <p>
            Link quiz generato:{" "}
            <a href={quizUrl} target="_blank" rel="noopener noreferrer">
              {quizUrl}
            </a>
          </p>
          <button onClick={handleCopy}>📋 Copia link</button>

          <div ref={qrRef} style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <QRCodeCanvas value={quizUrl} size={180} />
          </div>

          <button onClick={handleDownloadQR}>⬇️ Scarica QR code</button>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
