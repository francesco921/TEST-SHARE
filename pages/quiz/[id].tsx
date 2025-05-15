import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import "../../styles/quiz.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function QuizPage() {
  const router = useRouter();
  const { id } = router.query;
  const resultRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPDF = async () => {
    if (!resultRef.current) return;
    const canvas = await html2canvas(resultRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("quiz_risultati.pdf");
  };

  if (loading) return <p className="quiz-container">Caricamento quiz...</p>;
  if (notFound) return <p className="quiz-container">Quiz non trovato.</p>;

  if (submitted) {
    return (
      <div className="quiz-container" ref={resultRef}>
        <h2>Punteggio: {score} / {quiz.length}</h2>
        {quiz.map((q, i) => (
          <div key={i} className="result-block">
            <p><strong>{i + 1}.</strong> {q.question}</p>
            <ul>
              {q.options.map((opt, j) => {
                const letter = ["A", "B", "C", "D"][j];
                const isUser = answers[i] === letter;
                const isCorrect = q.correctAnswer === letter;
                return (
                  <li key={letter} className={
                    isCorrect
                      ? "correct"
                      : isUser
                      ? "incorrect"
                      : ""
                  }>
                    {letter}) {opt} {isCorrect ? "(corretta)" : isUser ? "(tua risposta)" : ""}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <button onClick={handleDownloadPDF} className="button">Scarica PDF</button>
      </div>
    );
  }

  const q = quiz[currentIndex];
  return (
    <div className="quiz-container">
      <h2>Domanda {currentIndex + 1} di {quiz.length}</h2>
      <div className="question">
        <p><strong>{q.question}</strong></p>
        {q.options.map((opt, j) => {
          const letter = ["A", "B", "C", "D"][j];
          return (
            <label key={letter} className="option">
              <input
                type="radio"
                name={`q-${currentIndex}`}
                value={letter}
                checked={selectedAnswer === letter}
                onChange={() => setSelectedAnswer(letter)}
              />
              {letter}) {opt}
            </label>
          );
        })}
      </div>
      <button
        onClick={handleNext}
        disabled={!selectedAnswer}
        className="button"
      >
        {currentIndex + 1 === quiz.length ? "Vedi risultato" : "Avanti"}
      </button>
    </div>
  );
}
