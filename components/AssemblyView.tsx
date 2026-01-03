import React, { useState } from 'react';
import { RocketConfig, MissionObjectives } from '../types';
import { Settings, Crosshair, TrendingUp, AlertTriangle, ArrowRight, Hammer, CheckCircle2, Rocket as RocketIcon, Ruler, Scale, Gauge } from 'lucide-react';

interface AssemblyViewProps {
  config: RocketConfig;
  objectives: MissionObjectives;
  onConfigChange: (newConfig: RocketConfig) => void;
  onObjectivesChange: (newObj: MissionObjectives) => void;
  onLaunch: () => void;
}

const ROCKET_PRESETS = [
  {
    id: 'falcon9',
    name: 'Falcon 9',
    description: 'Medium lift. Reusable booster.',
    config: {
      name: 'Falcon 9',
      stage1: { fuelMass: 25000, dryMass: 4000, thrust: 760000, burnRate: 150 },
      stage2: { fuelMass: 8000, dryMass: 1500, thrust: 95000, burnRate: 25 },
      dragCoefficient: 0.75,
      payloadMass: 1000
    }
  },
  {
    id: 'falconheavy',
    name: 'Falcon Heavy',
    description: 'Heavy lift. Triple core config.',
    config: {
      name: 'Falcon Heavy',
      stage1: { fuelMass: 60000, dryMass: 10000, thrust: 1800000, burnRate: 350 },
      stage2: { fuelMass: 12000, dryMass: 2000, thrust: 110000, burnRate: 30 },
      dragCoefficient: 0.9,
      payloadMass: 3000
    }
  },
  {
    id: 'starship',
    name: 'Starship',
    description: 'Super heavy. Stainless steel.',
    config: {
      name: 'Starship',
      stage1: { fuelMass: 150000, dryMass: 30000, thrust: 4500000, burnRate: 800 },
      stage2: { fuelMass: 50000, dryMass: 10000, thrust: 1200000, burnRate: 200 },
      dragCoefficient: 0.85,
      payloadMass: 5000
    }
  },
  {
    id: 'sls',
    name: 'SLS Block 1',
    description: 'Artemis Moon Rocket. SRB-augmented.',
    config: {
      name: 'SLS Block 1',
      stage1: { fuelMass: 110000, dryMass: 22000, thrust: 3800000, burnRate: 600 },
      stage2: { fuelMass: 25000, dryMass: 4000, thrust: 250000, burnRate: 40 },
      dragCoefficient: 0.82,
      payloadMass: 4000
    }
  }
];

const AssemblyView: React.FC<AssemblyViewProps> = ({ 
  config, 
  objectives, 
  onConfigChange, 
  onObjectivesChange, 
  onLaunch 
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'mission'>('build');

  // Calculate TWR (Thrust to Weight Ratio)
  const totalMass = config.stage1.fuelMass + config.stage1.dryMass + config.stage2.fuelMass + config.stage2.dryMass + config.payloadMass;
  const gravityForce = totalMass * 9.81;
  const twr = config.stage1.thrust / gravityForce;
  const isFlyable = twr > 1.1;

  const handleSliderChange = (type: 'altitude' | 'velocity', value: number) => {
    onObjectivesChange({
      ...objectives,
      [type === 'altitude' ? 'targetAltitude' : 'targetVelocity']: value
    });
  };

  const applyPreset = (preset: typeof ROCKET_PRESETS[0]) => {
    onConfigChange(preset.config);
  };

  const isStarship = config.name.includes('Starship');
  const isSLS = config.name.includes('SLS');
  const isHeavy = config.name.includes('Heavy');

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-7xl h-[85vh] grid grid-cols-12 gap-6">
        
        {/* Left Panel: Controls */}
        <div className="col-span-12 md:col-span-4 glass-panel rounded-xl flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800">
            <div>
              <h1 className="text-xl font-display font-bold text-white tracking-wider flex items-center gap-2">
                <Hammer className="text-blue-500 w-5 h-5" /> VAB <span className="text-slate-600 text-xs font-mono">BUILD_VER_2.4</span>
              </h1>
            </div>
            <div className="flex gap-1">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex border-b border-slate-700">
            <button 
              onClick={() => setActiveTab('build')}
              className={`flex-1 py-4 font-mono text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'build' ? 'bg-slate-800/50 text-blue-400 border-blue-500' : 'text-slate-500 border-transparent hover:text-white'}`}
            >
              01 // Configuration
            </button>
            <button 
              onClick={() => setActiveTab('mission')}
              className={`flex-1 py-4 font-mono text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'mission' ? 'bg-slate-800/50 text-emerald-400 border-emerald-500' : 'text-slate-500 border-transparent hover:text-white'}`}
            >
              02 // Mission Profile
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {activeTab === 'build' ? (
              <div className="space-y-8">
                
                {/* Preset Selection */}
                <div className="space-y-4">
                   <h3 className="text-slate-400 font-mono text-[10px] uppercase tracking-widest border-b border-slate-700 pb-2">Vehicle Architecture</h3>
                   <div className="grid grid-cols-1 gap-2">
                     {ROCKET_PRESETS.map(preset => (
                       <button
                         key={preset.id}
                         onClick={() => applyPreset(preset)}
                         className={`group relative p-4 rounded border text-left transition-all overflow-hidden ${
                           config.name === preset.name
                             ? 'bg-blue-900/10 border-blue-500/50'
                             : 'bg-slate-800/30 border-slate-700 hover:border-slate-500'
                         }`}
                       >
                         {config.name === preset.name && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                         <div className="flex justify-between items-center mb-1">
                           <span className={`font-display font-bold ${config.name === preset.name ? 'text-white' : 'text-slate-300'}`}>
                             {preset.name.toUpperCase()}
                           </span>
                           {config.name === preset.name && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                         </div>
                         <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">{preset.description}</p>
                       </button>
                     ))}
                   </div>
                </div>

                {/* Technical Specs */}
                <div className="space-y-6">
                  <h3 className="text-slate-400 font-mono text-[10px] uppercase tracking-widest border-b border-slate-700 pb-2">Propulsion Parameters</h3>
                  
                  {/* Thrust Control */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <label className="text-slate-300 text-xs font-medium flex items-center gap-2">
                         <Gauge className="w-3 h-3 text-orange-500" /> Stage 1 Thrust
                       </label>
                       <span className="font-mono text-xs text-orange-400 bg-orange-900/20 px-2 py-0.5 rounded">
                         {(config.stage1.thrust/1000).toFixed(0)} kN
                       </span>
                    </div>
                    <div className="relative h-6 flex items-center">
                       <input 
                        type="range"
                        min={config.stage1.thrust * 0.5}
                        max={config.stage1.thrust * 1.5}
                        value={config.stage1.thrust}
                        onChange={(e) => onConfigChange({...config, stage1: {...config.stage1, thrust: Number(e.target.value)}})}
                        className="w-full z-10"
                      />
                    </div>
                  </div>

                   {/* Mass Control */}
                   <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <label className="text-slate-300 text-xs font-medium flex items-center gap-2">
                         <Scale className="w-3 h-3 text-blue-500" /> Fuel Load
                       </label>
                       <span className="font-mono text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded">
                         {(config.stage1.fuelMass/1000).toFixed(0)} T
                       </span>
                    </div>
                    <input 
                      type="range"
                      min={config.stage1.fuelMass * 0.5}
                      max={config.stage1.fuelMass * 1.5}
                      value={config.stage1.fuelMass}
                      onChange={(e) => onConfigChange({...config, stage1: {...config.stage1, fuelMass: Number(e.target.value)}})}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Payload Control */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <label className="text-slate-300 text-xs font-medium flex items-center gap-2">
                         <Ruler className="w-3 h-3 text-purple-500" /> Payload
                       </label>
                       <span className="font-mono text-xs text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded">
                         {config.payloadMass.toFixed(0)} kg
                       </span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={config.payloadMass}
                      onChange={(e) => onConfigChange({...config, payloadMass: Number(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                </div>

              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-emerald-900/10 border border-emerald-500/20 p-5 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-20">
                     <Crosshair className="w-24 h-24 text-emerald-500" />
                  </div>
                  <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2 font-display uppercase tracking-wider">
                    <Crosshair className="w-4 h-4" /> Orbital Parameters
                  </h3>
                  
                  <div className="space-y-8 relative z-10">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-slate-300 text-xs font-bold uppercase">Apoapsis Target</label>
                        <span className="text-emerald-400 font-mono text-sm bg-emerald-950 px-2 rounded border border-emerald-900">{(objectives.targetAltitude / 1000).toFixed(0)} km</span>
                      </div>
                      <input 
                        type="range" 
                        min="10000" 
                        max="200000" 
                        step="5000" 
                        value={objectives.targetAltitude}
                        onChange={(e) => handleSliderChange('altitude', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-slate-300 text-xs font-bold uppercase">Velocity Target</label>
                        <span className="text-blue-400 font-mono text-sm bg-blue-950 px-2 rounded border border-blue-900">{objectives.targetVelocity.toLocaleString()} m/s</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="5000" 
                        step="100" 
                        value={objectives.targetVelocity}
                        onChange={(e) => handleSliderChange('velocity', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-800/30 rounded border border-slate-700">
                  <h4 className="text-slate-200 font-bold mb-4 text-xs uppercase tracking-wider font-mono">Flight Sequence</h4>
                  <ul className="text-xs space-y-3 font-mono text-slate-400">
                    <li className="flex gap-3 items-center">
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[8px]">1</div>
                      <span className="text-slate-300">Ignition & Liftoff</span>
                      <span className="ml-auto text-[10px] text-slate-600">T-00:00</span>
                    </li>
                    <li className="flex gap-3 items-center">
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[8px]">2</div>
                      <span className="text-slate-300">Max Q (Dynamic Pressure)</span>
                      <span className="ml-auto text-[10px] text-slate-600">Variable</span>
                    </li>
                    <li className="flex gap-3 items-center">
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[8px]">3</div>
                      <span className="text-slate-300">MECO (Main Engine Cut Off)</span>
                      <span className="ml-auto text-[10px] text-slate-600">Fuel Depletion</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Action */}
          <div className="p-6 bg-slate-900 border-t border-slate-800">
             {activeTab === 'build' ? (
                <button 
                  onClick={() => setActiveTab('mission')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
                >
                  Confirm Configuration <ArrowRight className="w-4 h-4" />
                </button>
             ) : (
                <button 
                  onClick={onLaunch}
                  disabled={!isFlyable}
                  className={`w-full py-4 rounded font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isFlyable 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 hover:shadow-emerald-900/80' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                   {isFlyable ? 'Initiate Launch Sequence' : 'Systems Check Failed'} 
                   <Settings className={`w-4 h-4 ${isFlyable ? 'animate-spin' : ''}`} />
                </button>
             )}
          </div>
        </div>

        {/* Right Panel: Visualization */}
        <div className="col-span-12 md:col-span-8 bg-[#0a0a0a] rounded-xl relative overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
           
           {/* Blueprint Background */}
           <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ 
                backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)'
             }} 
           />
           
           {/* Measurement Lines (Decor) */}
           <div className="absolute left-10 top-10 bottom-10 w-px bg-slate-800 flex flex-col justify-between py-20 pointer-events-none">
              <div className="w-2 h-px bg-slate-600"></div>
              <div className="w-4 h-px bg-slate-400"></div>
              <div className="w-2 h-px bg-slate-600"></div>
           </div>
           
           {/* Rocket Visual - Updated to match Canvas Style */}
           <div className="relative z-10 flex flex-col items-center w-full max-w-xs transition-all duration-700 scale-125">
              
              {/* Nosecone */}
              <div 
                className="w-16 h-24 relative z-20 mb-[-1px]"
                style={{
                  background: isStarship 
                    ? 'linear-gradient(to right, #64748b, #cbd5e1 50%, #475569)'
                    : 'linear-gradient(to right, #94a3b8, #f8fafc 50%, #64748b)',
                  borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                }}
              ></div>
              
              {/* Stage 2 */}
              <div 
                className="w-16 relative z-10"
                style={{ 
                  height: `${Math.max(60, config.stage2.fuelMass / 500 * (isStarship ? 0.3 : 1))}px`,
                  background: isStarship 
                    ? 'linear-gradient(to right, #64748b, #cbd5e1 50%, #475569)' 
                    : isSLS
                      ? 'linear-gradient(to right, #94a3b8, #f8fafc 50%, #64748b)'
                      : 'linear-gradient(to right, #94a3b8, #f8fafc 50%, #64748b)'
                }}
              >
                <div className="absolute inset-0 border-x border-black/10"></div>
                {isStarship && (
                  <>
                   <div className="absolute top-0 left-[-8px] w-2 h-8 bg-slate-700 rounded-l"></div>
                   <div className="absolute top-0 right-[-8px] w-2 h-8 bg-slate-700 rounded-r"></div>
                  </>
                )}
                <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold -rotate-90 font-mono tracking-widest opacity-50 ${isStarship ? 'text-slate-800' : 'text-slate-500'}`}>
                  {isStarship ? 'S2' : isSLS ? 'ICPS' : 'USA'}
                </span>
              </div>
              
              {/* Interstage */}
              <div className="w-14 h-4 bg-slate-900 z-10 flex justify-center gap-1 border-y border-slate-700"></div>

              {/* Stage 1 */}
              <div className="relative flex justify-center items-start">
                 {/* SLS Boosters */}
                 {isSLS && (
                   <>
                    <div className="absolute left-[-26px] top-4 w-5 h-48 bg-gradient-to-r from-slate-200 via-white to-slate-300 rounded-t-full border border-slate-300"></div>
                    <div className="absolute right-[-26px] top-4 w-5 h-48 bg-gradient-to-r from-slate-200 via-white to-slate-300 rounded-t-full border border-slate-300"></div>
                   </>
                 )}
                 
                 {/* Main Core */}
                 <div 
                    className="relative z-10"
                    style={{ 
                      width: isHeavy ? '128px' : '64px',
                      height: `${Math.max(100, config.stage1.fuelMass / 1000 * (isStarship ? 0.4 : 1))}px`,
                      background: isStarship
                        ? 'linear-gradient(to right, #64748b, #cbd5e1 50%, #475569)'
                        : isSLS
                          ? 'linear-gradient(to right, #c2410c, #fb923c 50%, #9a3412)'
                          : 'linear-gradient(to right, #94a3b8, #f8fafc 50%, #64748b)'
                    }}
                 >
                    <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black -rotate-90 tracking-[0.3em] font-mono opacity-50 ${isStarship ? 'text-slate-800' : isSLS ? 'text-orange-900' : 'text-slate-400'}`}>
                        {isStarship ? 'HEAVY' : isHeavy ? 'HEAVY' : isSLS ? 'NASA' : 'BOOSTER'}
                    </span>
                 </div>
              </div>
              
              {/* Engines */}
              <div className="flex gap-1 mt-[-2px] relative z-0">
                 <div className="w-12 h-6 bg-slate-800 rounded-b-md"></div>
              </div>
           </div>

           {/* Stats Overlay Cards */}
           <div className="absolute bottom-6 left-6 grid grid-cols-2 gap-3 w-64">
              <div className="glass-panel p-3 rounded shadow-lg">
                 <div className="text-slate-500 text-[10px] font-mono uppercase mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> TWR
                 </div>
                 <div className={`text-xl font-mono font-bold ${isFlyable ? 'text-emerald-400' : 'text-red-400'}`}>
                    {twr.toFixed(2)}
                 </div>
              </div>
              <div className="glass-panel p-3 rounded shadow-lg">
                 <div className="text-slate-500 text-[10px] font-mono uppercase mb-1 flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Mass
                 </div>
                 <div className="text-xl font-mono font-bold text-white">
                    {(totalMass/1000).toFixed(1)}t
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default AssemblyView;