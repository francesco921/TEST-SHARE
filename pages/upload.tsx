import { useState } from "react";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "../lib/supabase";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function UploadPage() {
  const [link, setLink] = useState("");
  const [quizUrl, setQuizUrl] = useState("");
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
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

      const { error: insertError } = await supabase.from("quizzes").insert([
        {
          id,
          data: quiz,
        },
      ]);

      if (insertError) {
        console.error(insertError);
        setError("Errore nel salvataggio su Supabase.");
        return;
      }

      const fullUrl = `${window.location.origin}/quiz/${id}`;
      setLink(`/quiz/${id}`);
      setQuizUrl(fullUrl);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Errore nell'elaborazione del file.");
    }
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
          <QRCodeCanvas value={quizUrl} size={180} />
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
