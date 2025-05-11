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
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchQuiz = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("data")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Quiz non trovato o errore:", error);
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

  const handleChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = () => {
    let correct = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        correct++;
      }
    });
    setScore(correct);
    setSubmitted(true);
  };

  if (loading) return <p style={{ padding: "2rem" }}>Caricamento quiz...</p>;
  if (notFound) return <p style={{ padding: "2rem", color: "red" }}>Quiz non trovato.</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "2rem" }}>
      <h1>Quiz</h1>

      {!submitted ? (
        <>
          {quiz.map((q, i) => (
            <div key={i} style={{ marginBottom: "1.5rem" }}>
              <p><strong>{i + 1}.</strong> {q.question}</p>
              {q.options.map((opt, j) => {
                const letter = ["A", "B", "C", "D"][j];
                return (
                  <label key={letter} style={{ display: "block" }}>
                    <input
                      type="radio"
                      name={`q-${i}`}
                      value={letter}
                      checked={answers[i] === letter}
                      onChange={() => handleChange(i, letter)}
                    />
                    {` ${letter}) ${opt}`}
                  </label>
                );
              })}
            </div>
          ))}
          <button onClick={handleSubmit}>Invia risposte</button>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
