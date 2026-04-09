"use client";
import { useState, useEffect, useMemo } from "react";
import { Question } from "@/lib/types";
import { useLang } from "@/lib/LangContext";
import AdSlot from "./AdSlot";

interface QuizClientProps {
  questions: Question[];
  questionsHi?: Question[];
}

export default function QuizClient({ questions, questionsHi }: QuizClientProps) {
  const { lang } = useLang();
  const qs = (lang === "hi" && questionsHi?.length) ? questionsHi : questions;

  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  // Reset quiz state when language changes
  useEffect(() => {
    setSelected({});
    setRevealed({});
  }, [lang]);

  const handleSelect = (qIdx: number, option: string) => {
    if (revealed[qIdx]) return;
    setSelected(prev => ({ ...prev, [qIdx]: option }));
    setRevealed(prev => ({ ...prev, [qIdx]: true }));
  };

  // Score tracking
  const stats = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    Object.entries(revealed).forEach(([idx, isRevealed]) => {
      if (!isRevealed) return;
      const qIdx = parseInt(idx);
      if (selected[qIdx] === qs[qIdx]?.answer) correct++;
      else wrong++;
    });
    return { correct, wrong, answered: correct + wrong, total: qs.length };
  }, [selected, revealed, qs]);

  const isComplete = stats.answered === stats.total && stats.total > 0;
  const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;

  if (!qs.length) {
    return <p className="text-slate-500 py-8 text-center">No questions available yet.</p>;
  }

  const LETTER_COLORS = [
    "bg-blue-500",
    "bg-orange-500",
    "bg-purple-500",
    "bg-teal-500",
  ];

  return (
    <div>
      {/* Sticky progress bar + score */}
      <div className="sticky top-14 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 rounded-xl mb-6 p-3 shadow-sm">
        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-2.5">
          <div
            className="h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(stats.answered / stats.total) * 100}%`,
              background: `linear-gradient(90deg, #3b82f6, ${accuracy >= 70 ? '#10b981' : accuracy >= 40 ? '#f59e0b' : '#ef4444'})`,
            }}
          />
        </div>
        {/* Score counters */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
              <span className="font-semibold text-emerald-600">{stats.correct}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">✗</span>
              <span className="font-semibold text-red-600">{stats.wrong}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            {stats.answered > 0 && (
              <span className={`font-bold ${accuracy >= 70 ? 'text-emerald-600' : accuracy >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                {accuracy}%
              </span>
            )}
            <span>{stats.answered}/{stats.total}</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {qs.map((q, qIdx) => {
          const isRevealed = revealed[qIdx];
          const isCorrect = selected[qIdx] === q.answer;

          return (
            <div key={`${lang}-${qIdx}`}>
              <div className={`bg-white rounded-2xl shadow-sm border-2 p-5 transition-all duration-300 ${
                isRevealed
                  ? isCorrect
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-red-200 bg-red-50/30'
                  : 'border-slate-100'
              }`}>
                {/* Question number + text */}
                <div className="flex gap-3 mb-4">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                    isRevealed
                      ? isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                      : 'bg-accent'
                  }`}>
                    {qIdx + 1}
                  </span>
                  <h3 className="font-semibold text-base md:text-lg leading-snug pt-0.5">{q.q}</h3>
                </div>

                {/* Options */}
                <div className="grid gap-2.5 ml-0 md:ml-11">
                  {q.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isSelected = selected[qIdx] === letter;
                    const isOptionCorrect = letter === q.answer;

                    let optionClass = "quiz-option flex items-center gap-3";
                    let badgeClass = `w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${LETTER_COLORS[oIdx]}`;
                    let iconEl = null;

                    if (isRevealed) {
                      if (isOptionCorrect) {
                        optionClass = "quiz-option correct flex items-center gap-3";
                        badgeClass = "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-emerald-500";
                        iconEl = (
                          <span className="ml-auto shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </span>
                        );
                      } else if (isSelected && !isOptionCorrect) {
                        optionClass = "quiz-option wrong flex items-center gap-3";
                        badgeClass = "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-red-500";
                        iconEl = (
                          <span className="ml-auto shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </span>
                        );
                      } else {
                        optionClass = "quiz-option flex items-center gap-3 opacity-50";
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        className={optionClass}
                        onClick={() => handleSelect(qIdx, letter)}
                        disabled={isRevealed}
                      >
                        <span className={badgeClass}>{letter}</span>
                        <span className="flex-1 text-left">{opt}</span>
                        {iconEl}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {isRevealed && q.explain && (
                  <div className="mt-4 ml-0 md:ml-11 p-4 bg-blue-50 rounded-xl text-sm border border-blue-100">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5 shrink-0">💡</span>
                      <div>
                        <p className="font-semibold text-blue-700 mb-1">Explanation</p>
                        <p className="text-slate-700 leading-relaxed">{q.explain}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* In-article ad after Q5 */}
              {qIdx === 4 && qs.length > 5 && (
                <AdSlot slot="inArticle1" format="fluid" className="my-6" />
              )}
              {/* In-article ad after Q15 */}
              {qIdx === 14 && qs.length > 15 && (
                <AdSlot slot="inArticle2" format="fluid" className="my-6" />
              )}
            </div>
          );
        })}
      </div>

      {/* Completion card */}
      {isComplete && (
        <div className="mt-8 rounded-2xl overflow-hidden shadow-lg border-2 border-slate-100">
          {/* Header with gradient */}
          <div className={`p-6 text-center text-white ${
            accuracy >= 80
              ? 'bg-gradient-to-br from-emerald-500 to-green-600'
              : accuracy >= 50
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-red-500 to-rose-600'
          }`}>
            <div className="text-5xl mb-3">
              {accuracy >= 80 ? '🏆' : accuracy >= 50 ? '👍' : '💪'}
            </div>
            <h3 className="text-2xl font-black mb-1">
              {accuracy >= 80 ? 'Excellent!' : accuracy >= 50 ? 'Good Job!' : 'Keep Practicing!'}
            </h3>
            <p className="text-white/80 text-sm">Set Complete</p>
          </div>

          {/* Score details */}
          <div className="bg-white p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-600">{stats.correct}</p>
                <p className="text-xs text-slate-400 mt-1">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-500">{stats.wrong}</p>
                <p className="text-xs text-slate-400 mt-1">Wrong</p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-black ${accuracy >= 70 ? 'text-emerald-600' : accuracy >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                  {accuracy}%
                </p>
                <p className="text-xs text-slate-400 mt-1">Accuracy</p>
              </div>
            </div>

            {/* Accuracy bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
              <div
                className="h-3 rounded-full transition-all duration-1000"
                style={{
                  width: `${accuracy}%`,
                  background: accuracy >= 70 ? '#10b981' : accuracy >= 40 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>

            {/* Retry button */}
            <button
              onClick={() => { setSelected({}); setRevealed({}); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full bg-accent text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              Retry This Set
            </button>
          </div>
        </div>
      )}

      {/* SEO: Hidden answers for Google crawling */}
      <div className="sr-only" aria-hidden="true">
        {qs.map((q, i) => (
          <div key={`seo-${i}`}>
            <p>Q: {q.q}</p>
            <p>Answer: {q.options[q.answer.charCodeAt(0) - 65]}</p>
            {q.explain && <p>Explanation: {q.explain}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
