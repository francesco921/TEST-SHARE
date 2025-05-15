import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

// Tipi domanda
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

  if (loading) return <p className="text-center p-8">Caricamento quiz...</p>;
  if (notFound)
    return <p className="text-center p-8 text-red-500">Quiz non trovato.</p>;

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Punteggio: {score} / {quiz.length}
        </h2>
        {quiz.map((q, i) => (
          <div
            key={i}
            className="mb-6 p-4 border border-gray-300 rounded-md shadow-sm"
          >
            <p className="font-medium mb-2">
              <strong>{i + 1}.</strong> {q.question}
            </p>
            <ul className="ml-4">
              {q.options.map((opt, j) => {
                const letter = ["A", "B", "C", "D"][j];
                const isUser = answers[i] === letter;
                const isCorrect = q.correctAnswer === letter;
                return (
                  <li
                    key={letter}
                    className={`mb-1 ${
                      isCorrect
                        ? "text-green-600 font-semibold"
                        : isUser
                        ? "text-red-500"
                        : "text-gray-700"
                    }`}
                  >
                    {letter}) {opt}
                    {isCorrect ? " (corretta)" : isUser ? " (tua risposta)" : ""}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  const q = quiz[currentIndex];
  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">
          Domanda {currentIndex + 1} di {quiz.length}
        </h2>
        <p className="mb-4">{q.question}</p>
        {q.options.map((opt, j) => {
          const letter = ["A", "B", "C", "D"][j];
          return (
            <label key={letter} className="block mb-2 cursor-pointer">
              <input
                type="radio"
                name={`q-${currentIndex}`}
                value={letter}
                checked={selectedAnswer === letter}
                onChange={() => setSelectedAnswer(letter)}
                className="mr-2"
              />
              {letter}) {opt}
            </label>
          );
        })}
      </div>
      <button
        onClick={handleNext}
        disabled={!selectedAnswer}
        className={`px-4 py-2 rounded-md text-white font-semibold ${
          selectedAnswer ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {currentIndex + 1 === quiz.length ? "Vedi risultato" : "Avanti"}
      </button>
    </div>
  );
}
