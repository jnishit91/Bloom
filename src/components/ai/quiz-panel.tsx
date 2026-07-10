"use client";

import { useState, useEffect, useRef } from "react";
import { useAi } from "./ai-provider";
import { HelpCircle, Check, X, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export function QuizPanel() {
  const { lessonContext } = useAi();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchQuiz() {
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResults(false);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "quiz",
          lessonId: lessonContext?.lessonId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      setQuestions(data.questions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate quiz",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelect(optionIndex: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIndex);
    setAnswers((prev) => [...prev, optionIndex]);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="size-6 animate-spin text-bloom-rose" />
        <p className="text-sm text-muted-foreground">Generating quiz…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchQuiz} className="gap-1.5">
          <RotateCcw className="size-3.5" />
          Try Again
        </Button>
      </div>
    );
  }

  if (showResults) {
    let score = 0;
    for (let i = 0; i < answers.length; i++) {
      if (answers[i] === questions[i]?.correct) score++;
    }

    return (
      <div className="p-4 space-y-4">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-sage/20 flex items-center justify-center mb-3">
            <span className="font-display text-2xl text-sage">
              {score}/{questions.length}
            </span>
          </div>
          <p className="font-display text-lg text-botanical">
            {score === questions.length
              ? "Perfect score!"
              : score >= questions.length * 0.6
                ? "Great job!"
                : "Keep learning!"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            You got {score} out of {questions.length} correct
          </p>
        </div>

        {/* Review */}
        <div className="space-y-3">
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correct;
            return (
              <div
                key={i}
                className={`p-3 rounded-bloom-sm border text-sm ${
                  isCorrect
                    ? "border-sage/30 bg-sage/5"
                    : "border-bloom-rose/30 bg-bloom-rose/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <Check className="size-4 text-sage mt-0.5 flex-shrink-0" />
                  ) : (
                    <X className="size-4 text-bloom-rose mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-botanical">{q.question}</p>
                    {!isCorrect && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Correct: {q.options[q.correct]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => {
            hasStarted.current = false;
            fetchQuiz();
          }}
        >
          <RotateCcw className="size-3.5" />
          Try Another Quiz
        </Button>
      </div>
    );
  }

  // Question card
  const question = questions[currentIndex];
  if (!question) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Progress dots */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-4 text-bloom-rose" />
          <span className="text-sm font-medium text-botanical">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < currentIndex
                  ? answers[i] === questions[i]?.correct
                    ? "bg-sage"
                    : "bg-bloom-rose"
                  : i === currentIndex
                    ? "bg-botanical"
                    : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <p className="text-sm font-medium text-botanical leading-relaxed">
        {question.question}
      </p>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isSelected = selectedAnswer === i;
          const isCorrect = i === question.correct;
          const showFeedback = selectedAnswer !== null;

          let optionStyle = "border-border hover:border-bloom-rose/50 hover:bg-bloom-rose/5 cursor-pointer";
          if (showFeedback) {
            if (isCorrect) {
              optionStyle = "border-sage bg-sage/10";
            } else if (isSelected && !isCorrect) {
              optionStyle = "border-bloom-rose bg-bloom-rose/10";
            } else {
              optionStyle = "border-border opacity-60 cursor-default";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selectedAnswer !== null}
              className={`w-full text-left p-3 rounded-bloom-sm border text-sm transition-colors ${optionStyle}`}
            >
              <div className="flex items-center gap-2">
                {showFeedback && isCorrect && (
                  <Check className="size-4 text-sage flex-shrink-0" />
                )}
                {showFeedback && isSelected && !isCorrect && (
                  <X className="size-4 text-bloom-rose flex-shrink-0" />
                )}
                <span>{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {selectedAnswer !== null && (
        <div className="p-3 rounded-bloom-sm bg-ivory-warm text-sm text-botanical/80 animate-fade-in-up">
          <p className="font-medium text-botanical mb-1">Explanation</p>
          <p>{question.explanation}</p>
        </div>
      )}

      {/* Next button */}
      {selectedAnswer !== null && (
        <Button onClick={handleNext} size="sm" className="w-full">
          {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
        </Button>
      )}
    </div>
  );
}
