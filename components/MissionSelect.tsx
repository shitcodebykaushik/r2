import React, { useState } from 'react';
import { MissionObjectives } from '../types';
import { MISSION_PROFILES } from '../constants';
import { Rocket, Target, Award, ArrowRight, Info, Zap, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MissionSelectProps {
  currentMission: MissionObjectives | null;
  onMissionSelect: (mission: MissionObjectives) => void;
  onBack: () => void;
  onContinue: () => void;
}

const difficultyColors = {
  easy: { bg: 'bg-emerald-900/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  medium: { bg: 'bg-blue-900/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  hard: { bg: 'bg-purple-900/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  extreme: { bg: 'bg-red-900/20', border: 'border-red-500/50', text: 'text-red-400' }
};

const difficultyLabels = {
  easy: 'Beginner',
  medium: 'Intermediate', 
  hard: 'Advanced',
  extreme: 'Expert'
};

const MissionSelect: React.FC<MissionSelectProps> = ({ currentMission, onMissionSelect, onBack, onContinue }) => {
  const [selectedMission, setSelectedMission] = useState<string | null>(
    currentMission?.missionType || null
  );
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const missions = Object.values(MISSION_PROFILES);

  const handleSelect = (missionId: string) => {
    setSelectedMission(missionId);
    const mission = MISSION_PROFILES[missionId as keyof typeof MISSION_PROFILES];
    onMissionSelect({
      targetAltitude: mission.targetAltitude,
      targetVelocity: mission.targetVelocity,
      missionType: mission.id,
      missionName: mission.name,
      description: mission.description,
      difficulty: mission.difficulty,
      requiredDeltaV: mission.requiredDeltaV,
      rewards: mission.rewards
    });
  };

  const selectedMissionData = selectedMission 
    ? MISSION_PROFILES[selectedMission as keyof typeof MISSION_PROFILES]
    : null;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-6 overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-600 rounded-lg shadow-lg shadow-purple-500/30">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Mission Control</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Select your mission objective. Each mission has unique challenges and requirements.
          </p>
        </div>

        {/* Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {missions.map((mission) => {
            const isSelected = selectedMission === mission.id;
            const colors = difficultyColors[mission.difficulty];
            
            return (
              <div
                key={mission.id}
                onClick={() => handleSelect(mission.id)}
                onMouseEnter={() => setShowDetails(mission.id)}
                onMouseLeave={() => setShowDetails(null)}
                className={`relative group cursor-pointer rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                  isSelected 
                    ? `${colors.border} ${colors.bg} shadow-xl scale-105` 
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50'
                }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10">
                    <CheckCircle2 className={`w-6 h-6 ${colors.text}`} />
                  </div>
                )}

                <div className="p-6">
                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-5xl">{mission.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{mission.name}</h3>
                      <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                        {difficultyLabels[mission.difficulty]}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {mission.description}
                  </p>

                  {/* Key Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-500 mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Target Alt
                      </div>
                      <div className="font-mono font-bold text-white">
                        {mission.targetAltitude >= 1000000 
                          ? `${(mission.targetAltitude / 1000).toFixed(0)} km`
                          : `${(mission.targetAltitude / 1000).toFixed(0)} km`}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-500 mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Delta-V
                      </div>
                      <div className="font-mono font-bold text-white">
                        {(mission.requiredDeltaV / 1000).toFixed(1)} km/s
                      </div>
                    </div>
                  </div>

                  {/* Hover Details */}
                  {showDetails === mission.id && (
                    <div className="mt-4 pt-4 border-t border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="text-xs space-y-2">
                        <div className="flex items-start gap-2">
                          <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-300">{mission.description}</span>
                        </div>
                        {mission.rewards && mission.rewards.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Award className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-slate-400">
                              {mission.rewards.join(' • ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom accent line */}
                {isSelected && (
                  <div className={`h-1 w-full ${colors.text.replace('text-', 'bg-')}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Mission Details Panel */}
        {selectedMissionData && (
          <div className="glass-panel rounded-xl p-6 border border-slate-700 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start gap-6">
              <div className="text-7xl">{selectedMissionData.icon}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedMissionData.name}</h2>
                <p className="text-slate-300 mb-4">{selectedMissionData.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-slate-500 text-xs mb-1">TARGET ALTITUDE</div>
                    <div className="text-xl font-mono font-bold text-white">
                      {selectedMissionData.targetAltitude >= 1000000
                        ? `${(selectedMissionData.targetAltitude / 1000000).toFixed(0)} Mm`
                        : `${(selectedMissionData.targetAltitude / 1000).toFixed(0)} km`}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-slate-500 text-xs mb-1">TARGET VELOCITY</div>
                    <div className="text-xl font-mono font-bold text-blue-400">
                      {(selectedMissionData.targetVelocity / 1000).toFixed(1)} km/s
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-slate-500 text-xs mb-1">REQUIRED ΔV</div>
                    <div className="text-xl font-mono font-bold text-purple-400">
                      {(selectedMissionData.requiredDeltaV / 1000).toFixed(1)} km/s
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-slate-500 text-xs mb-1">DIFFICULTY</div>
                    <div className={`text-xl font-bold uppercase ${difficultyColors[selectedMissionData.difficulty].text}`}>
                      {difficultyLabels[selectedMissionData.difficulty]}
                    </div>
                  </div>
                </div>

                {/* Difficulty Warning */}
                {selectedMissionData.difficulty === 'hard' || selectedMissionData.difficulty === 'extreme' ? (
                  <div className="mt-4 bg-orange-900/20 border border-orange-500/50 rounded-lg p-3 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-orange-400 font-bold text-sm mb-1">Advanced Mission</div>
                      <div className="text-orange-200 text-xs">
                        This mission requires a powerful rocket with high delta-V capability. 
                        Ensure your design meets the requirements before attempting launch.
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-lg font-medium transition-all border border-slate-700"
          >
            <ArrowRight className="w-5 h-5 rotate-180" /> Back to VAB
          </button>

          <button 
            onClick={onContinue}
            disabled={!selectedMission}
            className={`flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${
              selectedMission
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/30'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Rocket className="w-5 h-5" />
            Confirm Mission & Launch
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionSelect;
