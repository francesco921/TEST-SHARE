import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!id) return;

    fetch(`/quizzes/${id}.json`)
      .then((res) => res.json())
      .then((data: QuizQuestion[]) => {
        setQuiz(data);
        setAnswers(Array(data.length).fill(""));
      })
      .catch(() => {
        console.error("Quiz non trovato.");
      });
  }, [id]);

  const handleChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = () => {
    let count = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        count++;
      }
    });
    setScore(count);
    setSubmitted(true);
  };

  if (!quiz.length) return <p>Caricamento...</p>;

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
