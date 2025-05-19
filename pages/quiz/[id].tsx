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

  if (loading) return <p className="p-8">Caricamento...</p>;
  if (notFound) return <p className="p-8 text-red-600">Quiz non trovato.</p>;

  if (submitted) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div id="quiz-result">
          <h2 className="text-2xl font-bold mb-6">Punteggio: {score} / {quiz.length}</h2>
          {quiz.map((q, i) => {
            const userAns = answers[i];
            const correctLetter = q.correctAnswer;
            const correctText = q.options["ABCD".indexOf(correctLetter)];
            const userText = q.options["ABCD".indexOf(userAns)] || "—";
            const isCorrect = userAns === correctLetter;
            return (
              <div key={i} className="mb-4">
                <p className="font-semibold">{i + 1}. {q.question}</p>
                <p>
                  Risposta data: <strong>{userAns || "—"}) {userText}</strong> —{" "}
                  {isCorrect ? (
                    <span className="text-green-600">corretto</span>
                  ) : (
                    <span className="text-red-600">
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
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Scarica PDF
        </button>
      </div>
    );
  }

  const current = quiz[currentIndex];
  const selected = answers[currentIndex];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar domande */}
      <aside className="w-64 border-r bg-white px-6 py-8 space-y-3">
        <h2 className="text-lg font-semibold mb-4">Domande</h2>
        <ul className="space-y-2">
          {quiz.map((_, i) => (
            <li key={i}>
              <button
                onClick={() => goTo(i)}
                className={`block w-full text-left rounded px-4 py-2 text-sm border transition ${
                  i === currentIndex
                    ? "bg-blue-100 border-blue-500 font-semibold"
                    : answers[i]
                    ? "bg-green-50 border-green-300"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                Domanda {i + 1}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Contenuto principale */}
      <main className="flex-1 p-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold">
            Domanda {currentIndex + 1} di {quiz.length}
          </h1>
          <button
            onClick={handleDownloadPDF}
            className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Stampa PDF
          </button>
        </div>

        <h2 className="text-lg font-semibold mb-6">{current.question}</h2>

        <div className="space-y-3 mb-10">
          {current.options.map((opt, i) => {
            const letter = "ABCD"[i];
            return (
              <label
                key={letter}
                className={`block border rounded-lg px-4 py-3 cursor-pointer transition ${
                  selected === letter
                    ? "bg-blue-100 border-blue-500"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                <input
                  type="radio"
                  className="hidden"
                  name={`q-${currentIndex}`}
                  value={letter}
                  checked={selected === letter}
                  onChange={() => handleChange(letter)}
                />
                <span className="font-semibold mr-2">{letter})</span> {opt}
              </label>
            );
          })}
        </div>

        <div className="flex gap-4">
          <button
            onClick={prev}
            className="bg-white border px-4 py-2 rounded text-sm disabled:opacity-50"
            disabled={currentIndex === 0}
          >
            ← Indietro
          </button>
          <button
            onClick={handleFinish}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm"
          >
            Termina quiz
          </button>
          <button
            onClick={next}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            disabled={currentIndex === quiz.length - 1}
          >
            Avanti →
          </button>
        </div>
      </main>
    </div>
  );
}
