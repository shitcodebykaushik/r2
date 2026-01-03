import React, { useState } from 'react';
import { CheckCircle, XCircle, Award, AlertTriangle, RefreshCw } from 'lucide-react';

interface QuizViewProps {
  onPass: () => void;
}

const questions = [
  {
    id: 1,
    question: "What creates the force required to lift the rocket off the ground?",
    options: [
      { id: 'a', text: "Gravity" },
      { id: 'b', text: "Drag" },
      { id: 'c', text: "Thrust" },
      { id: 'd', text: "Aerodynamics" }
    ],
    correct: 'c'
  },
  {
    id: 2,
    question: "Why do we use multi-stage rockets?",
    options: [
      { id: 'a', text: "To make the rocket look cooler" },
      { id: 'b', text: "To shed dead weight (empty tanks) and increase efficiency" },
      { id: 'c', text: "To increase air resistance" },
      { id: 'd', text: "To land easier" }
    ],
    correct: 'b'
  },
  {
    id: 3,
    question: "If your Thrust is 100kN and your Weight is 150kN, what happens?",
    options: [
      { id: 'a', text: "The rocket flies up very fast" },
      { id: 'b', text: "The rocket stays on the ground" },
      { id: 'c', text: "The rocket explodes" },
      { id: 'd', text: "The rocket enters orbit immediately" }
    ],
    correct: 'b'
  }
];

const QuizView: React.FC<QuizViewProps> = ({ onPass }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (qId: number, optionId: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optionId }));
  };

  const handleSubmit = () => {
    let newScore = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct) newScore++;
    });
    setScore(newScore);
    setSubmitted(true);
  };

  const hasPassed = score === questions.length;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-8">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Flight Certification Exam</h2>
          <p className="text-slate-400">Prove you are ready to command the simulation.</p>
        </div>

        <div className="space-y-6">
          {questions.map((q) => {
            const isCorrect = submitted && answers[q.id] === q.correct;
            const isWrong = submitted && answers[q.id] !== q.correct;

            return (
              <div key={q.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <p className="text-white font-medium mb-3">{q.id}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(q.id, opt.id)}
                      disabled={submitted}
                      className={`w-full text-left px-4 py-2 rounded transition-all text-sm ${
                        answers[q.id] === opt.id 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      } ${
                        submitted && opt.id === q.correct ? 'ring-2 ring-emerald-500' : ''
                      } ${
                        submitted && answers[q.id] === opt.id && opt.id !== q.correct ? 'ring-2 ring-red-500' : ''
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== questions.length}
            className="w-full mt-8 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-lg shadow-purple-500/20 transition-all"
          >
            Submit Exam
          </button>
        ) : (
          <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            {hasPassed ? (
              <div className="bg-emerald-900/30 border border-emerald-500/50 p-6 rounded-xl">
                <Award className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-white mb-1">Certification Granted!</h3>
                <p className="text-emerald-200 mb-4">You scored {score}/{questions.length}. You are cleared for launch.</p>
                <button
                  onClick={onPass}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-emerald-500/20 w-full"
                >
                  Enter Simulation
                </button>
              </div>
            ) : (
              <div className="bg-red-900/30 border border-red-500/50 p-6 rounded-xl">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-white mb-1">Certification Failed</h3>
                <p className="text-red-200 mb-4">You scored {score}/{questions.length}. Review the materials and try again.</p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setAnswers({});
                    setScore(0);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 w-full"
                >
                  <RefreshCw className="w-4 h-4" /> Retake Exam
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default QuizView;