import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { SimulationState, TrajectoryPoint } from '../types';
import { Activity, Zap } from 'lucide-react';

interface TelemetryPanelProps {
  history: Partial<SimulationState>[];
  prediction: TrajectoryPoint[];
}

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ history, prediction }) => {
  const displayHistory = history.slice(-200).map(h => ({
    time: h.time,
    altitude: h.altitude,
    predictedAltitude: null
  }));

  const lastTime = displayHistory.length > 0 ? displayHistory[displayHistory.length - 1].time : 0;
  const validPrediction = prediction.filter(p => (p.time || 0) > (lastTime || 0));

  const bridgePoint = displayHistory.length > 0 ? [{
     time: displayHistory[displayHistory.length - 1].time,
     altitude: null,
     predictedAltitude: displayHistory[displayHistory.length - 1].altitude
  }] : [];

  const chartData = [...displayHistory, ...bridgePoint, ...validPrediction];

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 text-blue-400">
           <Activity className="w-5 h-5" />
           <h2 className="text-lg font-bold uppercase tracking-wider">Telemetry</h2>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-yellow-400 border border-yellow-400/30 px-2 py-1 rounded bg-yellow-400/10">
           <Zap className="w-3 h-3" /> PREDICTIVE LINK ACTIVE
        </div>
      </div>

      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              tick={{fill: '#94a3b8', fontSize: 10}} 
              tickFormatter={(val) => val.toFixed(0)}
              type="number"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis 
              tick={{fill: '#94a3b8', fontSize: 10}}
              label={{ value: 'Alt (m)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ fontSize: 12 }}
              labelStyle={{ color: '#94a3b8', marginBottom: 5 }}
              formatter={(value: any, name: string) => [
                 value ? Number(value).toFixed(0) + 'm' : '-', 
                 name === 'altitude' ? 'Actual' : 'Forecast'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="altitude" 
              stroke="#10b981" 
              strokeWidth={2} 
              dot={false}
              name="Actual Flight"
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="predictedAltitude" 
              stroke="#fbbf24" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={false}
              name="Projected Trajectory"
              isAnimationActive={false}
            />
            {lastTime > 0 && <ReferenceLine x={lastTime} stroke="#475569" strokeDasharray="3 3" />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between mt-4 text-xs font-mono">
         <div className="flex items-center gap-2 text-slate-400">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Actual
         </div>
         <div className="flex items-center gap-2 text-yellow-400">
            <span className="w-8 h-0 border-t-2 border-dashed border-yellow-400"></span> Predicted Path
         </div>
      </div>
    </div>
  );
};

export default TelemetryPanel;