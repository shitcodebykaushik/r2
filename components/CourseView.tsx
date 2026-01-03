import React, { useState } from 'react';
import { ArrowRight, BookOpen, Rocket, Wind, Layers, ArrowLeft } from 'lucide-react';

interface CourseViewProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "1. The Physics of Flight",
    icon: <Rocket className="w-12 h-12 text-blue-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Rocketry is governed by Newton's Third Law: <em className="text-white">"For every action, there is an equal and opposite reaction."</em>
        </p>
        <p className="text-slate-300">
          To move upwards, a rocket expels mass (fuel) downwards at high speed. This creates <strong>Thrust</strong>.
        </p>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h4 className="font-bold text-white mb-2">Key Formula: TWR (Thrust-to-Weight Ratio)</h4>
          <p className="text-sm text-slate-400">
            If your Thrust is less than your Weight (Gravity), the rocket won't lift off. 
            <br/>
            <span className="text-emerald-400 font-mono">TWR > 1.0</span> is required for launch.
          </p>
        </div>
      </div>
    )
  },
  {
    title: "2. Fighting the Atmosphere",
    icon: <Wind className="w-12 h-12 text-teal-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          As the rocket speeds up, it pushes against air molecules. This resistance is called <strong>Drag</strong>.
        </p>
        <p className="text-slate-300">
          Drag increases exponentially with speed. However, as you go higher, the air gets thinner (Atmospheric Density drops), reducing drag.
        </p>
        <ul className="list-disc pl-5 text-slate-400 space-y-2">
          <li><strong>Max Q:</strong> The point of maximum dynamic pressure where structural stress is highest.</li>
          <li><strong>Streamlining:</strong> A lower Drag Coefficient (Cd) means the rocket cuts through air easier.</li>
        </ul>
      </div>
    )
  },
  {
    title: "3. The Power of Staging",
    icon: <Layers className="w-12 h-12 text-orange-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          The tyranny of the rocket equation states that to carry more fuel, you need more fuel to lift that fuel.
        </p>
        <p className="text-slate-300">
          <strong>Staging</strong> solves this by dropping "dead weight" (empty tanks and heavy engines) once they are used up.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-800 p-3 rounded border border-slate-700">
            <h5 className="font-bold text-orange-400">Stage 1 (Booster)</h5>
            <p className="text-xs text-slate-400">High thrust, heavy. Gets you out of the thick atmosphere.</p>
          </div>
          <div className="bg-slate-800 p-3 rounded border border-slate-700">
            <h5 className="font-bold text-blue-400">Stage 2 (Upper)</h5>
            <p className="text-xs text-slate-400">Efficient, lighter. Accelerates to orbital velocity in a vacuum.</p>
          </div>
        </div>
      </div>
    )
  }
];

const CourseView: React.FC<CourseViewProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold text-white tracking-wider">ORBITAL ACADEMY</h1>
          </div>
          <div className="text-slate-500 font-mono text-sm">
            MODULE {currentSlide + 1} / {slides.length}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 flex flex-col">
          <div className="flex-1">
            <div className="mb-6 flex items-center gap-4">
              {slides[currentSlide].icon}
              <h2 className="text-3xl font-bold text-white">{slides[currentSlide].title}</h2>
            </div>
            <div className="text-lg leading-relaxed">
              {slides[currentSlide].content}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700 h-1 mt-8 mb-8 rounded-full overflow-hidden">
            <div 
              className="bg-purple-500 h-full transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Previous
            </button>

            {currentSlide < slides.length - 1 ? (
              <button
                onClick={() => setCurrentSlide(currentSlide + 1)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                Next Concept <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 animate-pulse"
              >
                Start Certification Exam <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView;