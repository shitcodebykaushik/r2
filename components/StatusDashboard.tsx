import React from 'react';
import { SimulationState, RocketConfig, MissionObjectives } from '../types';
import { Gauge, Thermometer, Wind, Zap, Activity, AlertTriangle, Target, TrendingUp, Navigation, CheckCircle2, XCircle } from 'lucide-react';

interface StatusDashboardProps {
  state: SimulationState;
  config: RocketConfig;
  predictedApogee: number;
  objectives: MissionObjectives;
}

const StatusDashboard: React.FC<StatusDashboardProps> = ({ state, config, predictedApogee, objectives }) => {
  const fuelPercent = state.activeStage === 1 
    ? (state.stage1Fuel / config.stage1.fuelMass) * 100 
    : (state.stage2Fuel / config.stage2.fuelMass) * 100;
  
  const totalMass = state.activeStage === 1
    ? config.stage1.dryMass + state.stage1Fuel + config.stage2.dryMass + state.stage2Fuel + config.payloadMass
    : config.stage2.dryMass + state.stage2Fuel + config.payloadMass;
  
  const mach = state.velocity / 343;
  
  // Payload fraction
  const payloadFraction = (config.payloadMass / totalMass) * 100;

  // Mission objective tracking
  const altitudeAchieved = state.maxAltitude >= objectives.targetAltitude;
  const velocityAchieved = state.maxVelocity >= objectives.targetVelocity;
  const deltaVSufficient = state.deltaVExpended >= objectives.requiredDeltaV * 0.8; // 80% threshold

  return (
    <div className="space-y-3">
      {/* Mission Objectives */}
      {objectives.missionType !== 'custom' && (
        <div className="glass-panel rounded-lg p-4 border border-slate-700">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target className="w-3 h-3" /> Mission Objectives
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Altitude Target:</span>
              <div className="flex items-center gap-2">
                {altitudeAchieved ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-slate-600" />
                )}
                <span className={`font-mono ${altitudeAchieved ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {(state.maxAltitude / 1000).toFixed(1)}/{(objectives.targetAltitude / 1000).toFixed(0)} km
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Velocity Target:</span>
              <div className="flex items-center gap-2">
                {velocityAchieved ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-slate-600" />
                )}
                <span className={`font-mono ${velocityAchieved ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {state.maxVelocity.toFixed(0)}/{objectives.targetVelocity.toFixed(0)} m/s
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Delta-V Budget:</span>
              <div className="flex items-center gap-2">
                {deltaVSufficient ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-slate-600" />
                )}
                <span className={`font-mono ${deltaVSufficient ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {state.deltaVExpended.toFixed(0)}/{objectives.requiredDeltaV.toFixed(0)} m/s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Flight Data */}
      <div className="glass-panel rounded-lg p-4 border border-slate-700">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-3 h-3" /> Primary Flight Data
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] text-slate-500 mb-1">ALTITUDE</div>
            <div className="text-xl font-mono font-bold text-white">{(state.altitude / 1000).toFixed(2)} km</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 mb-1">VELOCITY</div>
            <div className="text-xl font-mono font-bold text-blue-400">{state.velocity.toFixed(0)} m/s</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 mb-1">MACH</div>
            <div className="text-lg font-mono font-bold text-emerald-400">{mach.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 mb-1">TIME</div>
            <div className="text-lg font-mono font-bold text-slate-300">{state.time.toFixed(1)}s</div>
          </div>
        </div>
      </div>

      {/* Structural & Environmental */}
      <div className="glass-panel rounded-lg p-4 border border-slate-700">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" /> Structural Status
        </h3>
        <div className="space-y-3">
          {/* G-Force */}
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Gauge className="w-3 h-3" /> G-FORCE
              </span>
              <span className={`font-mono ${state.gForce > 3 ? 'text-orange-400' : 'text-slate-300'}`}>
                {state.gForce.toFixed(2)}g
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  state.gForce > 3 ? 'bg-orange-500' : state.gForce > 2 ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (state.gForce / 4) * 100)}%` }}
              />
            </div>
          </div>

          {/* Dynamic Pressure (Max Q) */}
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Wind className="w-3 h-3" /> DYNAMIC PRESSURE
              </span>
              <span className="font-mono text-slate-300">{(state.dynamicPressure / 1000).toFixed(1)} kPa</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${Math.min(100, (state.dynamicPressure / state.maxDynamicPressure) * 100)}%` }}
              />
            </div>
            {state.maxDynamicPressure > 0 && (
              <div className="text-[9px] text-slate-500 mt-1">
                Max Q: {(state.maxDynamicPressure / 1000).toFixed(1)} kPa
              </div>
            )}
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3 h-3" /> SKIN TEMP
              </span>
              <span className={`font-mono ${state.temperature > 800 ? 'text-red-400' : 'text-blue-300'}`}>
                {state.temperature.toFixed(0)}K
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  state.temperature > 1000 ? 'bg-red-500' : state.temperature > 600 ? 'bg-orange-400' : 'bg-blue-400'
                }`}
                style={{ width: `${Math.min(100, (state.temperature / 1500) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Propulsion & Mass */}
      <div className="glass-panel rounded-lg p-4 border border-slate-700">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="w-3 h-3" /> Propulsion System
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-400">STAGE {state.activeStage} FUEL</span>
              <span className={`font-mono ${fuelPercent < 20 ? 'text-red-400' : 'text-emerald-400'}`}>
                {fuelPercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${fuelPercent < 20 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${fuelPercent}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <div className="text-slate-500 mb-0.5">TOTAL MASS</div>
              <div className="font-mono text-slate-300">{(totalMass / 1000).toFixed(1)}t</div>
            </div>
            <div>
              <div className="text-slate-500 mb-0.5">PAYLOAD</div>
              <div className="font-mono text-purple-400">{config.payloadMass.toFixed(0)}kg</div>
            </div>
            <div>
              <div className="text-slate-500 mb-0.5">THRUST ANGLE</div>
              <div className="font-mono text-slate-300">{state.thrustAngle.toFixed(1)}°</div>
            </div>
            <div>
              <div className="text-slate-500 mb-0.5">DOWNRANGE</div>
              <div className="font-mono text-slate-300">{(state.downrangeDistance / 1000).toFixed(1)}km</div>
            </div>
          </div>
        </div>
      </div>

      {/* Delta-V Budget */}
      <div className="glass-panel rounded-lg p-4 border border-slate-700">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="w-3 h-3" /> Delta-V Budget
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Expended</span>
            <span className="font-mono text-orange-400">{state.deltaVExpended.toFixed(0)} m/s</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Remaining</span>
            <span className="font-mono text-emerald-400">{state.deltaVRemaining.toFixed(0)} m/s</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${(state.deltaVRemaining / (state.deltaVExpended + state.deltaVRemaining || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Atmosphere */}
      <div className="glass-panel rounded-lg p-4 border border-slate-700">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Navigation className="w-3 h-3" /> Atmosphere
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Layer</span>
            <span className="font-mono text-cyan-400">{state.atmosphereLayer}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Density</span>
            <span className="font-mono text-slate-300">{state.atmosphericDensity.toFixed(4)} kg/m³</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Predicted Apogee</span>
            <span className="font-mono text-yellow-400">{(predictedApogee / 1000).toFixed(1)} km</span>
          </div>
        </div>
      </div>

      {/* Mission Stats */}
      <div className="glass-panel rounded-lg p-4 border border-slate-700">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-3 h-3" /> Peak Values
        </h3>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <div className="text-slate-500 mb-0.5">MAX ALT</div>
            <div className="font-mono text-white">{(state.maxAltitude / 1000).toFixed(2)}km</div>
          </div>
          <div>
            <div className="text-slate-500 mb-0.5">MAX VEL</div>
            <div className="font-mono text-blue-400">{state.maxVelocity.toFixed(0)}m/s</div>
          </div>
          <div>
            <div className="text-slate-500 mb-0.5">MAX G</div>
            <div className="font-mono text-orange-400">{state.maxGForce.toFixed(2)}g</div>
          </div>
          <div>
            <div className="text-slate-500 mb-0.5">MAX TEMP</div>
            <div className="font-mono text-red-400">{state.maxTemperature.toFixed(0)}K</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusDashboard;
