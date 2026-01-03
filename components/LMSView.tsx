import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  FileText, 
  CheckCircle, 
  Circle, 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  Lock, 
  Play,
  AlertCircle
} from 'lucide-react';

interface LMSViewProps {
  onComplete: () => void;
}

type UnitType = 'video' | 'article' | 'quiz';

interface Question {
  id: number;
  text: string;
  options: { id: string; text: string }[];
  correct: string;
}

interface CourseUnit {
  id: string;
  title: string;
  type: UnitType;
  duration: string; // e.g., "5 min"
  content?: React.ReactNode;
  questions?: Question[];
}

const courseData: CourseUnit[] = [
  {
    id: 'intro',
    title: 'Introduction to Orbital Mechanics',
    type: 'video',
    duration: '2 min',
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white">Welcome to the Program</h3>
        <p className="text-slate-300 leading-relaxed">
          Before you can take command of the Gemini-1 spacecraft, you must understand the fundamental forces at play. 
          Rocketry isn't just about going up; it's about balancing <strong className="text-white">Thrust</strong>, <strong className="text-white">Gravity</strong>, and <strong className="text-white">Drag</strong>.
        </p>
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
          <h4 className="font-bold text-blue-400 mb-1">The Golden Rule</h4>
          <p className="text-sm text-slate-300">
            For every action, there is an equal and opposite reaction. (Newton's Third Law)
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'atmosphere',
    title: 'Atmospheric Drag & Max Q',
    type: 'article',
    duration: '5 min',
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white">Fighting the Air</h3>
        <p className="text-slate-300 leading-relaxed">
          As a rocket accelerates, it pushes against air molecules. This creates resistance known as <strong>Drag</strong>. 
          The faster you go, the harder the air pushes back—exponentially.
        </p>
        
        <h4 className="text-xl font-bold text-white mt-4">What is Max Q?</h4>
        <p className="text-slate-300 leading-relaxed">
          <strong>Max Q</strong> (Maximum Dynamic Pressure) is the moment during launch when mechanical stress on the rocket is highest. 
          It occurs when the combination of air density and velocity produces the maximum force. After this point, the air gets thinner, and drag decreases even as you speed up.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
           <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <div className="text-teal-400 font-bold mb-2">Low Altitude</div>
              <p className="text-xs text-slate-400">High Air Density + Low Speed = Moderate Drag</p>
           </div>
           <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <div className="text-orange-400 font-bold mb-2">High Altitude</div>
              <p className="text-xs text-slate-400">Low Air Density + High Speed = Low Drag</p>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'staging',
    title: 'Multi-Stage Rocketry',
    type: 'video',
    duration: '4 min',
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white">Shedding the Weight</h3>
        <p className="text-slate-300 leading-relaxed">
          The "Rocket Equation" is a harsh mistress. To carry fuel, you need more fuel to lift that fuel. 
          The solution is <strong>Staging</strong>.
        </p>
        <ul className="space-y-4">
          <li className="flex gap-3">
            <div className="min-w-[40px] h-[40px] rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">1</div>
            <div>
              <h5 className="text-white font-bold">The Booster (Stage 1)</h5>
              <p className="text-sm text-slate-400">Massive engines, huge fuel tanks. Its only job is to get you out of the thick atmosphere.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="min-w-[40px] h-[40px] rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">2</div>
            <div>
              <h5 className="text-white font-bold">The Upper Stage (Stage 2)</h5>
              <p className="text-sm text-slate-400">Efficient vacuum engines. Once the heavy booster is dropped, this light stage accelerates to orbital velocity.</p>
            </div>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 'exam',
    title: 'Final Certification Exam',
    type: 'quiz',
    duration: '10 min',
    questions: [
      {
        id: 1,
        text: "What generates the upward force to lift the rocket?",
        options: [
           { id: 'a', text: "Aerodynamic Lift" },
           { id: 'b', text: "Thrust" },
           { id: 'c', text: "Gravity" },
           { id: 'd', text: "Centrifugal Force" }
        ],
        correct: 'b'
      },
      {
        id: 2,
        text: "When does 'Max Q' occur?",
        options: [
           { id: 'a', text: "At liftoff" },
           { id: 'b', text: "In space" },
           { id: 'c', text: "When aerodynamic stress is highest" },
           { id: 'd', text: "During landing" }
        ],
        correct: 'c'
      },
      {
        id: 3,
        text: "Why do we discard the first stage?",
        options: [
           { id: 'a', text: "To reduce mass once fuel is used" },
           { id: 'b', text: "To make the rocket look smaller" },
           { id: 'c', text: "To slow down" },
           { id: 'd', text: "It is required by law" }
        ],
        correct: 'a'
      }
    ]
  }
];

const LMSView: React.FC<LMSViewProps> = ({ onComplete }) => {
  const [activeUnitIndex, setActiveUnitIndex] = useState(0);
  const [completedUnits, setCompletedUnits] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  const activeUnit = courseData[activeUnitIndex];

  const handleUnitSelect = (index: number) => {
    // Can only navigate if previous units are complete (or strictly linear, let's allow free nav but strict completion)
    // For "Udemy" feel, usually you can click around, but let's enforce progression for the quiz
    if (courseData[index].type === 'quiz' && completedUnits.size < courseData.length - 1) {
      alert("Please complete all lessons before taking the exam.");
      return;
    }
    setActiveUnitIndex(index);
  };

  const markComplete = () => {
    const newSet = new Set(completedUnits);
    newSet.add(activeUnit.id);
    setCompletedUnits(newSet);
    
    if (activeUnitIndex < courseData.length - 1) {
      setActiveUnitIndex(activeUnitIndex + 1);
    }
  };

  const handleQuizSubmit = () => {
    if (!activeUnit.questions) return;
    
    const correctCount = activeUnit.questions.reduce((acc, q) => {
      return acc + (quizAnswers[q.id] === q.correct ? 1 : 0);
    }, 0);

    setQuizSubmitted(true);
    if (correctCount === activeUnit.questions.length) {
      setQuizPassed(true);
      const newSet = new Set(completedUnits);
      newSet.add(activeUnit.id);
      setCompletedUnits(newSet);
    }
  };

  const getProgress = () => {
    return Math.round((completedUnits.size / courseData.length) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">OA</div>
           <div>
             <h1 className="text-white font-bold text-sm md:text-base">Orbital Architect Certification</h1>
             <div className="w-32 md:w-48 h-1 bg-slate-700 rounded-full mt-1">
               <div 
                 className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                 style={{ width: `${getProgress()}%` }}
               />
             </div>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm">
             <Trophy className="w-4 h-4 text-yellow-500" />
             <span>Your Progress: {getProgress()}%</span>
           </div>
           {quizPassed && (
             <button 
               onClick={onComplete}
               className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 animate-pulse"
             >
               Access Simulation <ChevronRight className="w-4 h-4" />
             </button>
           )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Main Content Area (Player) */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 flex justify-center">
          <div className="max-w-4xl w-full">
            
            {/* Media Player Placeholder */}
            <div className="aspect-video bg-black rounded-xl border border-slate-800 shadow-2xl mb-8 relative overflow-hidden group">
               {activeUnit.type === 'video' ? (
                 <>
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50 flex flex-col items-center justify-center">
                      <button className="w-20 h-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all transform hover:scale-110 group-hover:bg-blue-600">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </button>
                      <p className="mt-4 text-slate-300 font-mono text-sm">VIDEO LESSON PREVIEW</p>
                   </div>
                 </>
               ) : activeUnit.type === 'quiz' ? (
                 <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-8">
                    <Trophy className={`w-20 h-20 mb-4 ${quizPassed ? 'text-emerald-500' : 'text-slate-600'}`} />
                    <h2 className="text-3xl font-bold text-white mb-2">{activeUnit.title}</h2>
                    <p className="text-slate-400 text-center max-w-lg">
                      {quizPassed 
                        ? "Certification Granted. You are cleared for flight." 
                        : "Pass this exam to unlock the Simulation Sandbox."}
                    </p>
                 </div>
               ) : (
                 <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center">
                    <FileText className="w-20 h-20 text-slate-700 mb-4" />
                    <p className="text-slate-500 font-mono">READING MATERIAL</p>
                 </div>
               )}
            </div>

            {/* Lesson Content / Quiz Interface */}
            <div className="prose prose-invert max-w-none">
              
              {activeUnit.type !== 'quiz' && (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-3xl font-bold text-white m-0">{activeUnit.title}</h2>
                    {!completedUnits.has(activeUnit.id) ? (
                      <button 
                        onClick={markComplete}
                        className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2"
                      >
                        Complete & Continue <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                       <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 px-4 py-2 rounded-full">
                         <CheckCircle className="w-5 h-5" /> Completed
                       </div>
                    )}
                  </div>
                  <div className="text-lg text-slate-300">
                    {activeUnit.content}
                  </div>
                </>
              )}

              {/* Quiz UI */}
              {activeUnit.type === 'quiz' && activeUnit.questions && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8">
                   <div className="space-y-8">
                      {activeUnit.questions.map((q, idx) => {
                        const isCorrect = quizSubmitted && quizAnswers[q.id] === q.correct;
                        const isWrong = quizSubmitted && quizAnswers[q.id] !== q.correct;
                        const selected = quizAnswers[q.id];

                        return (
                          <div key={q.id} className="border-b border-slate-800 pb-6 last:border-0">
                             <h4 className="text-lg font-medium text-white mb-4 flex gap-2">
                               <span className="text-slate-500">{idx + 1}.</span> {q.text}
                             </h4>
                             <div className="space-y-2 pl-6">
                               {q.options.map(opt => (
                                 <label 
                                   key={opt.id} 
                                   className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                                     selected === opt.id 
                                       ? 'bg-blue-900/30 border-blue-500/50' 
                                       : 'bg-slate-800/50 border-transparent hover:bg-slate-800'
                                   } ${
                                     quizSubmitted && opt.id === q.correct ? 'bg-emerald-900/30 border-emerald-500' : ''
                                   } ${
                                     quizSubmitted && selected === opt.id && opt.id !== q.correct ? 'bg-red-900/30 border-red-500' : ''
                                   }`}
                                 >
                                    <input 
                                      type="radio" 
                                      name={`q-${q.id}`} 
                                      disabled={quizSubmitted && quizPassed}
                                      className="hidden"
                                      checked={selected === opt.id}
                                      onChange={() => !quizSubmitted && setQuizAnswers(prev => ({...prev, [q.id]: opt.id}))}
                                    />
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      selected === opt.id ? 'border-blue-400' : 'border-slate-500'
                                    }`}>
                                      {selected === opt.id && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
                                    </div>
                                    <span className="text-slate-300">{opt.text}</span>
                                    {quizSubmitted && opt.id === q.correct && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                                    {quizSubmitted && selected === opt.id && opt.id !== q.correct && <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />}
                                 </label>
                               ))}
                             </div>
                          </div>
                        );
                      })}
                   </div>

                   <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
                      {!quizPassed ? (
                         <button 
                           onClick={quizSubmitted ? () => { setQuizSubmitted(false); setQuizAnswers({}); } : handleQuizSubmit}
                           className={`px-8 py-3 rounded-lg font-bold text-white transition-all ${
                             quizSubmitted 
                               ? 'bg-slate-700 hover:bg-slate-600' 
                               : 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20'
                           }`}
                         >
                           {quizSubmitted ? "Retry Exam" : "Submit Answers"}
                         </button>
                      ) : (
                        <div className="flex items-center gap-4">
                           <span className="text-emerald-400 font-bold">Score: 100%</span>
                           <button 
                             onClick={onComplete}
                             className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-emerald-500/20 animate-pulse"
                           >
                             Complete Course & Enter Simulation
                           </button>
                        </div>
                      )}
                   </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Sidebar (Course Content) */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 hidden lg:flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <h3 className="font-bold text-white mb-1">Course Content</h3>
            <p className="text-xs text-slate-500">4 Modules • 25 Minutes</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {courseData.map((unit, idx) => {
              const isActive = idx === activeUnitIndex;
              const isCompleted = completedUnits.has(unit.id);
              const isLocked = !isCompleted && idx > 0 && !completedUnits.has(courseData[idx-1].id);

              return (
                <button
                  key={unit.id}
                  onClick={() => !isLocked && handleUnitSelect(idx)}
                  disabled={isLocked}
                  className={`w-full text-left p-4 flex items-start gap-3 border-b border-slate-800/50 transition-colors ${
                    isActive ? 'bg-slate-800 border-l-4 border-l-blue-500' : 'hover:bg-slate-800/50'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="mt-1">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5 text-slate-600" />
                    ) : unit.type === 'video' ? (
                      <PlayCircle className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    ) : unit.type === 'quiz' ? (
                      <Circle className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    ) : (
                      <FileText className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    )}
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {idx + 1}. {unit.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                        {unit.type} • {unit.duration}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LMSView;