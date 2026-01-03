import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Pause, Rocket as RocketIcon, Hammer, Volume2, VolumeX } from 'lucide-react';
import { RocketConfig, SimulationState, TrajectoryPoint, MissionObjectives } from './types';
import { DEFAULT_CONFIG, DT } from './constants';
import { calculateNextState, predictFlightPath } from './services/physicsEngine';
import { analyzeMission } from './services/geminiService';
import { audioManager } from './services/audioManager';
import { computeLandingGuidance, calculateRecoveryPercentage } from './services/landingGuidance';

import AssemblyView from './components/AssemblyView';
import SimulationView from './components/SimulationView';
import TelemetryPanel from './components/TelemetryPanel';
import AIAssistant from './components/AIAssistant';
import StatusDashboard from './components/StatusDashboard';
import MissionSelect from './components/MissionSelect';

const INITIAL_STATE: SimulationState = {
  time: 0,
  altitude: 0,
  velocity: 0,
  acceleration: 0,
  
  // 2D Position & Velocity
  positionX: 0,
  positionY: 6371000, // Earth radius (at surface)
  velocityX: 0,
  velocityY: 0,
  
  stage1Fuel: DEFAULT_CONFIG.stage1.fuelMass,
  stage2Fuel: DEFAULT_CONFIG.stage2.fuelMass,
  activeStage: 1,
  separationTime: null,
  phase: 'PRE_LAUNCH',
  maxAltitude: 0,
  maxVelocity: 0,
  
  // Orbital Elements
  apogee: 0,
  perigee: 0,
  eccentricity: 0,
  semiMajorAxis: 6371000,
  orbitalPeriod: 0,
  inclination: 0,
  orbitalVelocity: 0,
  isOrbiting: false,
  timeToApogee: 0,
  timeToPerigee: 0,
  orbitsCompleted: 0,
  
  temperature: 288,
  maxTemperature: 288,
  gForce: 0,
  maxGForce: 0,
  dynamicPressure: 0,
  maxDynamicPressure: 0,
  atmosphericDensity: 1.225,
  atmosphereLayer: 'Troposphere',
  deltaVExpended: 0,
  deltaVRemaining: 0,
  thrustAngle: 0,
  downrangeDistance: 0,
  structuralLoad: 0,
  
  // Engine Reliability
  stage1FailedEngines: [],
  stage2FailedEngines: [],
  thrustPercentage: 100,
  
  // Wind
  windVelocityX: 0,
  windVelocityY: 0,
  crosswindSpeed: 0,
  windForceX: 0,
  
  // Fuel Slosh
  fuelSloshOffset: 0,
  centerOfMassX: 0,
  centerOfMassY: 0,
  sloshTorque: 0,
  
  // RCS
  rcsFuel: DEFAULT_CONFIG.rcsFuel,
  rcsEnabled: false,
  rollAngle: 0,
  pitchRate: 0,
  yawRate: 0,
  rollRate: 0,
  manualControl: false,
  
  // Maneuvers
  plannedManeuvers: [],
  currentManeuver: null,
  
  // Payload
  payloadDeployed: false,
  deploymentTime: null,
  
  // Docking
  targetRelativePosition: null,
  targetRelativeVelocity: null,
  dockingAlignment: 0,
  isDocked: false,
  
  // Landing System
  landingLegsDeployed: false,
  gridFinsDeployed: false,
  landingBurnStartAltitude: null,
  landingTargetX: 0,
  landingAccuracy: 0,
  recoveryPercentage: 0,
  boostbackBurnComplete: false,
  reentryBurnComplete: false,
};

const DEFAULT_OBJECTIVES: MissionObjectives = {
  targetAltitude: 100000, // 100km
  targetVelocity: 3000,   // 3000m/s
  missionType: 'custom',
  missionName: 'Custom Mission',
  description: 'Custom flight parameters',
  difficulty: 'medium',
  requiredDeltaV: 5000,
};

type AppView = 'assembly' | 'mission-select' | 'simulation';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('assembly');
  
  // State
  // Initialize config with name if missing
  const [config, setConfig] = useState<RocketConfig>({ ...DEFAULT_CONFIG, name: 'Falcon 9' });
  const [objectives, setObjectives] = useState<MissionObjectives>(DEFAULT_OBJECTIVES);
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);
  const [history, setHistory] = useState<Partial<SimulationState>[]>([]);
  const [prediction, setPrediction] = useState<TrajectoryPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [previousPhase, setPreviousPhase] = useState<string>('PRE_LAUNCH');

  const requestRef = useRef<number>();
  const frameCountRef = useRef<number>(0);
  
  // Initialize audio on first user interaction
  const enableAudio = () => {
    if (!audioEnabled) {
      audioManager.initialize();
      setAudioEnabled(true);
    }
  };

  // Reset helper
  const handleReset = useCallback(() => {
    setIsRunning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    audioManager.stopEngineSound();
    audioManager.resetAnnouncements();
    setPreviousPhase('PRE_LAUNCH');
    setState({
      ...INITIAL_STATE,
      stage1Fuel: config.stage1.fuelMass,
      stage2Fuel: config.stage2.fuelMass,
      temperature: 288,
      maxTemperature: 288,
      gForce: 0,
      maxGForce: 0,
      dynamicPressure: 0,
      maxDynamicPressure: 0,
      atmosphericDensity: 1.225,
      atmosphereLayer: 'Troposphere',
      deltaVExpended: 0,
      deltaVRemaining: 0,
      thrustAngle: 0,
      downrangeDistance: 0,
      structuralLoad: 0,
    });
    setHistory([]);
    setPrediction([]);
    setLastAnalysis(null);
  }, [config]);

  // Handle configuration changes
  const handleConfigChange = (newConfig: RocketConfig) => {
    setConfig(newConfig);
    if (state.phase === 'PRE_LAUNCH') {
      setState(prev => ({ 
        ...prev, 
        stage1Fuel: newConfig.stage1.fuelMass,
        stage2Fuel: newConfig.stage2.fuelMass 
      }));
      // Run initial static prediction
      const initPred = predictFlightPath({
        ...INITIAL_STATE, 
        stage1Fuel: newConfig.stage1.fuelMass,
        stage2Fuel: newConfig.stage2.fuelMass
      }, newConfig);
      setPrediction(initPred);
    }
  };

  const handleLaunchRequest = () => {
    setCurrentView('mission-select');
  };

  const handleBackToAssembly = () => {
    setIsRunning(false);
    setCurrentView('assembly');
    handleReset();
  };

  const handleBackToMissions = () => {
    setCurrentView('mission-select');
    handleReset();
  };

  const handleBackFromMissionSelect = () => {
    setCurrentView('assembly');
  };

  const handleMissionConfirm = () => {
    setCurrentView('simulation');
    setIsRunning(true);
  };

  const handleMissionSelect = (mission: MissionObjectives) => {
    setObjectives(mission);
  };

  // Init prediction on load
  useEffect(() => {
    if (state.phase === 'PRE_LAUNCH' && prediction.length === 0) {
       const initPred = predictFlightPath(INITIAL_STATE, config);
       setPrediction(initPred);
    }
  }, []);

  // Main Physics Loop
  const tick = useCallback(() => {
    setState(prevState => {
      if (prevState.phase === 'LANDED' || prevState.phase === 'CRASHED') {
        setIsRunning(false);
        analyzeMission(config, prevState, history).then(setLastAnalysis);
        
        // Calculate recovery percentage on landing
        if (prevState.phase === 'LANDED' && prevState.recoveryPercentage === 0) {
          const recovery = calculateRecoveryPercentage(
            prevState.velocity,
            prevState.landingAccuracy,
            prevState.thrustAngle
          );
          return { ...prevState, recoveryPercentage: recovery };
        }
        
        return prevState;
      }

      if (prevState.phase === 'PRE_LAUNCH') {
        return { ...prevState, phase: 'BURNING' };
      }

      const nextState = calculateNextState(prevState, config);
      
      // Landing guidance system (only for stage 1 recovery)
      if (nextState.activeStage === 1 && nextState.altitude > 0) {
        const guidance = computeLandingGuidance(nextState, config, nextState.landingTargetX);
        
        // Phase transitions based on guidance
        if (guidance.shouldStartBoostback && !nextState.boostbackBurnComplete) {
          nextState.phase = 'BOOSTBACK';
        } else if (guidance.shouldStartReentry && !nextState.reentryBurnComplete) {
          nextState.phase = 'RE-ENTRY';
        } else if (guidance.shouldStartLanding) {
          nextState.phase = 'LANDING';
          if (!nextState.landingBurnStartAltitude) {
            nextState.landingBurnStartAltitude = nextState.altitude;
          }
        }
        
        // Deploy systems
        if (guidance.shouldDeployGridFins && !nextState.gridFinsDeployed) {
          nextState.gridFinsDeployed = true;
        }
        if (guidance.shouldDeployLegs && !nextState.landingLegsDeployed) {
          nextState.landingLegsDeployed = true;
          if (audioEnabled) audioManager.playLegsDeployment();
        }
        
        nextState.landingAccuracy = guidance.landingAccuracy;
        
        // Mark burns as complete
        if (nextState.phase === 'BOOSTBACK' && nextState.time - (nextState.separationTime || 0) > 20) {
          nextState.boostbackBurnComplete = true;
          nextState.phase = 'COASTING';
        }
        if (nextState.phase === 'RE-ENTRY' && nextState.altitude < 50000) {
          nextState.reentryBurnComplete = true;
          nextState.phase = 'DESCENT';
        }
      }
      
      // Audio events
      if (audioEnabled) {
        // Phase change sound
        if (nextState.phase !== previousPhase) {
          audioManager.handlePhaseChange(
            nextState.phase,
            nextState.altitude,
            nextState.velocity,
            nextState.activeStage
          );
          setPreviousPhase(nextState.phase);
        }
        
        // Max Q warning
        if (nextState.dynamicPressure > nextState.maxDynamicPressure * 0.9) {
          audioManager.speak('Approaching Max Q', 'maxq-warning');
        }
        
        // Structural warning
        if (nextState.gForce > 3.5) {
          audioManager.playWarningAlarm();
        }
      }
      
      setHistory(prev => {
        const newHist = [...prev, { 
          time: nextState.time, 
          altitude: nextState.altitude, 
          velocity: nextState.velocity 
        }];
        return newHist.length > 500 ? newHist.slice(-500) : newHist;
      });

      frameCountRef.current += 1;
      if (frameCountRef.current % 10 === 0) {
        const futurePath = predictFlightPath(nextState, config);
        setPrediction(futurePath);
      }

      return nextState;
    });
  }, [config, audioEnabled, previousPhase, history]);


  useEffect(() => {
    if (!isRunning) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = time - lastTime;
      if (delta >= DT * 1000) {
        tick();
        lastTime = time;
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, tick]);

  const predictedApogee = prediction.reduce((max, p) => Math.max(max, p.predictedAltitude || 0), 0);
  const currentFuelPercent = state.activeStage === 1 
      ? (state.stage1Fuel / config.stage1.fuelMass) * 100 
      : (state.stage2Fuel / config.stage2.fuelMass) * 100;

  if (currentView === 'mission-select') {
    return (
      <MissionSelect
        currentMission={objectives}
        onMissionSelect={handleMissionSelect}
        onBack={handleBackFromMissionSelect}
        onContinue={handleMissionConfirm}
      />
    );
  }

  if (currentView === 'assembly') {
    return (
      <AssemblyView 
        config={config} 
        objectives={objectives}
        onConfigChange={handleConfigChange} 
        onObjectivesChange={setObjectives}
        onLaunch={handleLaunchRequest}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 flex flex-col gap-6">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
            <RocketIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Applicable <span className="text-blue-500">Orbital</span></h1>
            <div className="flex items-center gap-2">
              <p className="text-slate-400 text-xs md:text-sm font-mono">SIMULATION MODE // {config.name.toUpperCase()}</p>
              {objectives.missionType !== 'custom' && (
                <span className="text-xs bg-purple-600/20 border border-purple-500/50 text-purple-300 px-2 py-0.5 rounded font-bold uppercase">
                  {objectives.missionName}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {/* Audio Toggle */}
          <button 
            onClick={() => {
              if (!audioEnabled) {
                enableAudio();
              } else {
                audioManager.setVolume(audioManager['volume'] > 0 ? 0 : 0.3);
              }
            }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg font-medium transition-all border border-slate-700 text-sm"
            title={audioEnabled ? "Sound On" : "Sound Off"}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
           <button 
            onClick={handleBackToMissions}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg font-medium transition-all border border-slate-700 text-sm"
          >
            ← Missions
          </button>
           <button 
            onClick={handleBackToAssembly}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-lg font-medium transition-all border border-slate-700"
          >
            <Hammer className="w-4 h-4" /> VAB
          </button>

          {!isRunning && (state.phase === 'PRE_LAUNCH' || state.phase === 'LANDED' || state.phase === 'CRASHED') ? (
            <button 
              onClick={() => { enableAudio(); setIsRunning(true); }}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
            >
              <Play className="w-5 h-5" /> RE-LAUNCH
            </button>
          ) : (
             <button 
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-yellow-500/20 transition-all"
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />} 
              {isRunning ? "PAUSE" : "RESUME"}
            </button>
          )}

          <button 
            onClick={handleReset}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-3 rounded-lg font-medium transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Col: Status Dashboard */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <StatusDashboard 
            state={state} 
            config={config}
            predictedApogee={predictedApogee}
            objectives={objectives}
          />
        </div>

        {/* Center: Simulation View */}
        <div className="lg:col-span-6 min-h-[500px] lg:h-auto flex flex-col">
          <SimulationView 
            state={state} 
            objectives={objectives}
            predictedApogee={predictedApogee} 
            history={history}
            rocketName={config.name}
          />
        </div>

        {/* Right Col: Telemetry & AI */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex-1 min-h-[300px]">
            <TelemetryPanel history={history} prediction={prediction} />
          </div>
          
          {/* AI Module */}
          <div className="min-h-[300px]">
            <AIAssistant 
              config={config} 
              lastMissionAnalysis={lastAnalysis} 
              isSimulating={isRunning} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;