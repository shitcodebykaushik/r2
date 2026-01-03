import React, { useState } from 'react';
import { RocketConfig, StageConfig } from '../types';
import { Settings, Fuel, Weight, Gauge, Wind, Layers } from 'lucide-react';

interface ControlPanelProps {
  config: RocketConfig;
  onConfigChange: (newConfig: RocketConfig) => void;
  disabled: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, onConfigChange, disabled }) => {
  const [activeTab, setActiveTab] = useState<'stage1' | 'stage2'>('stage1');

  const handleStageChange = (key: keyof StageConfig, value: number) => {
    onConfigChange({
      ...config,
      [activeTab]: {
        ...config[activeTab],
        [key]: value
      }
    });
  };

  const handleGlobalChange = (key: keyof RocketConfig, value: number) => {
    onConfigChange({ ...config, [key]: value });
  };

  const currentStage = config[activeTab];

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6 text-emerald-400">
        <Settings className="w-5 h-5" />
        <h2 className="text-lg font-bold uppercase tracking-wider">Configuration</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg">
        <button 
          onClick={() => setActiveTab('stage1')}
          className={`flex-1 py-2 px-3 rounded text-xs font-bold uppercase tracking-wide transition-all ${
            activeTab === 'stage1' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Stage 1 (Booster)
        </button>
        <button 
          onClick={() => setActiveTab('stage2')}
          className={`flex-1 py-2 px-3 rounded text-xs font-bold uppercase tracking-wide transition-all ${
            activeTab === 'stage2' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Stage 2 (Upper)
        </button>
      </div>

      <div className="space-y-6">
        {/* Thrust */}
        <div className="group">
          <div className="flex justify-between mb-2">
            <label className="text-slate-300 text-sm flex items-center gap-2">
              <Gauge className={`w-4 h-4 ${activeTab === 'stage1' ? 'text-orange-400' : 'text-blue-400'}`} /> 
              Thrust (N)
            </label>
            <span className="text-slate-100 font-mono text-sm">{currentStage.thrust.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={activeTab === 'stage1' ? "100000" : "10000"}
            max={activeTab === 'stage1' ? "1000000" : "200000"}
            step="1000"
            value={currentStage.thrust}
            onChange={(e) => handleStageChange('thrust', Number(e.target.value))}
            disabled={disabled}
            className={`w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 ${
              activeTab === 'stage1' ? 'accent-orange-500' : 'accent-blue-500'
            }`}
          />
        </div>

        {/* Fuel Mass */}
        <div className="group">
          <div className="flex justify-between mb-2">
            <label className="text-slate-300 text-sm flex items-center gap-2">
              <Fuel className="w-4 h-4 text-red-400" /> Fuel Mass (kg)
            </label>
            <span className="text-slate-100 font-mono text-sm">{currentStage.fuelMass.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="500"
            max={activeTab === 'stage1' ? "20000" : "5000"}
            step="100"
            value={currentStage.fuelMass}
            onChange={(e) => handleStageChange('fuelMass', Number(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-50"
          />
        </div>

        {/* Burn Rate */}
        <div className="group">
          <div className="flex justify-between mb-2">
            <label className="text-slate-300 text-sm flex items-center gap-2">
              <Fuel className="w-4 h-4 text-yellow-400" /> Burn Rate (kg/s)
            </label>
            <span className="text-slate-100 font-mono text-sm">{currentStage.burnRate.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={currentStage.burnRate}
            onChange={(e) => handleStageChange('burnRate', Number(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:opacity-50"
          />
        </div>

        {/* Dry Mass */}
        <div className="group">
          <div className="flex justify-between mb-2">
            <label className="text-slate-300 text-sm flex items-center gap-2">
              <Weight className="w-4 h-4 text-slate-400" /> Dry Mass (kg)
            </label>
            <span className="text-slate-100 font-mono text-sm">{currentStage.dryMass.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="100"
            max={activeTab === 'stage1' ? "5000" : "2000"}
            step="50"
            value={currentStage.dryMass}
            onChange={(e) => handleStageChange('dryMass', Number(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-500 disabled:opacity-50"
          />
        </div>

        <div className="h-px bg-slate-700 my-4" />

        {/* Drag Coefficient (Global) */}
        <div className="group">
          <div className="flex justify-between mb-2">
            <label className="text-slate-300 text-sm flex items-center gap-2">
              <Wind className="w-4 h-4 text-teal-400" /> Drag Coeff (Global)
            </label>
            <span className="text-slate-100 font-mono text-sm">{config.dragCoefficient.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={config.dragCoefficient}
            onChange={(e) => handleGlobalChange('dragCoefficient', Number(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;