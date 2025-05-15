import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function QuizPage() {
  const router = useRouter();
  const { id } = router.query;

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");

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

  const handleNext = () => {
    if (!selectedAnswer) return;

    const updated = [...answers];
    updated[currentIndex] = selectedAnswer;
    setAnswers(updated);
    setSelectedAnswer("");

    if (currentIndex + 1 < quiz.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      let count = 0;
      quiz.forEach((q, i) => {
        if (updated[i] === q.correctAnswer) count++;
      });
      setScore(count);
      setSubmitted(true);
    }
  };

  if (loading) return <p style={{ padding: "2rem" }}>Caricamento quiz...</p>;
  if (notFound) return <p style={{ padding: "2rem", color: "red" }}>Quiz non trovato.</p>;

  if (submitted) {
    return (
      <div style={{ maxWidth: "800px", margin: "auto", padding: "2rem" }}>
        <h2>Punteggio: {score} / {quiz.length}</h2>
        {quiz.map((q, i) => (
          <div key={i} style={{ marginBottom: "1rem" }}>
            <p><strong>{i + 1}.</strong> {q.question}</p>
            <p>
              Risposta data: <strong>{answers[i] || "—"}</strong> —{" "}
              {answers[i] === q.correctAnswer ? (
                <span style={{ color: "green" }}>corretto</span>
              ) : (
                <span style={{ color: "red" }}>
                  sbagliato (giusto: {q.correctAnswer})
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    );
  }

  const q = quiz[currentIndex];
  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "2rem" }}>
      <h2>Domanda {currentIndex + 1} di {quiz.length}</h2>
      <p><strong>{q.question}</strong></p>
      {q.options.map((opt, j) => {
        const letter = ["A", "B", "C", "D"][j];
        return (
          <label key={letter} style={{ display: "block", marginTop: "0.5rem" }}>
            <input
              type="radio"
              name={`q-${currentIndex}`}
              value={letter}
              checked={selectedAnswer === letter}
              onChange={() => setSelectedAnswer(letter)}
            />
            {` ${letter}) ${opt}`}
          </label>
        );
      })}
      <button
        onClick={handleNext}
        disabled={!selectedAnswer}
        style={{ marginTop: "1.5rem" }}
      >
        {currentIndex + 1 === quiz.length ? "Vedi risultato" : "Avanti"}
      </button>
    </div>
  );
}
