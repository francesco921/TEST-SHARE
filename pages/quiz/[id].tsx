import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string; // "A", "B", ...
};

export default function QuizPage() {
  const router = useRouter();
  const { id } = router.query;

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const fetchQuiz = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("data")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const parsed = data.data as QuizQuestion[];
      setQuiz(parsed);
      setAnswers(Array(parsed.length).fill(""));
      setLoading(false);
    };

    fetchQuiz();
  }, [id]);

  const handleChange = (value: string) => {
    const updated = [...answers];
    updated[currentIndex] = value;
    setAnswers(updated);
  };

  const handleFinish = () => {
    let correct = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("quiz-result");
    if (!element) return;

    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("quiz-risultati.pdf");
  };

  const goTo = (i: number) => setCurrentIndex(i);
  const next = () => setCurrentIndex((prev) => Math.min(prev + 1, quiz.length - 1));
  const prev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  if (loading) return <p style={{ padding: "2rem" }}>Caricamento...</p>;
  if (notFound) return <p style={{ padding: "2rem", color: "red" }}>Quiz non trovato.</p>;

  if (submitted) {
    return (
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
        <div id="quiz-result">
          <h2>Punteggio: {score} / {quiz.length}</h2>
          {quiz.map((q, i) => {
            const userAns = answers[i];
            const correctLetter = q.correctAnswer;
            const correctText = q.options["ABCD".indexOf(correctLetter)];
            const userText = q.options["ABCD".indexOf(userAns)] || "—";
            const isCorrect = userAns === correctLetter;
            return (
              <div key={i} style={{ marginBottom: "1rem" }}>
                <p><strong>{i + 1}. {q.question}</strong></p>
                <p>
                  Risposta data: <strong>{userAns || "—"}) {userText}</strong> —{" "}
                  {isCorrect ? (
                    <span style={{ color: "green" }}>corretto</span>
                  ) : (
                    <span style={{ color: "red" }}>
                      sbagliato (giusta: {correctLetter}) {correctText}
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{
            marginTop: "2rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          Scarica PDF
        </button>
      </div>
    );
  }

  const current = quiz[currentIndex];
  const selected = answers[currentIndex];

  return (
    <div style={{ display: "flex", padding: "2rem" }}>
      {/* Sidebar domande */}
      <div style={{ width: "200px", marginRight: "2rem" }}>
        <h4>Domande</h4>
        {quiz.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              display: "block",
              marginBottom: "4px",
              padding: "6px",
              backgroundColor: i === currentIndex ? "#dbeafe" : answers[i] ? "#dcfce7" : "#fef3c7",
              border: "1px solid #ccc",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            {i + 1}. {answers[i] ? "✓" : "—"}
          </button>
        ))}
      </div>

      {/* Contenuto domanda */}
      <div style={{ flex: 1 }}>
        <h3>Domanda {currentIndex + 1} di {quiz.length}</h3>
        <p><strong>{current.question}</strong></p>
        {current.options.map((opt, i) => {
          const letter = "ABCD"[i];
          return (
            <label key={letter} style={{ display: "block", marginTop: "0.5rem" }}>
              <input
                type="radio"
                name={`q-${currentIndex}`}
                value={letter}
                checked={selected === letter}
                onChange={() => handleChange(letter)}
              /> {letter}) {opt}
            </label>
          );
        })}

        <div style={{ marginTop: "2rem" }}>
          <button onClick={prev} disabled={currentIndex === 0} style={{ marginRight: "1rem" }}>
            ◀ Indietro
          </button>
          <button onClick={next} disabled={currentIndex === quiz.length - 1}>
            Avanti ▶
          </button>
        </div>

        <button
          onClick={handleFinish}
          style={{ marginTop: "2rem", backgroundColor: "#dc2626", color: "white", padding: "0.5rem 1rem" }}
        >
          Termina quiz
        </button>
      </div>
    </div>
  );
}
