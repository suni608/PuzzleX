import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import type { SolverStats } from "../utils/types";
import { Zap, Activity, Repeat } from "lucide-react";

interface StatsDashboardProps {
  stats: SolverStats | null;
  comparisonData: Array<{ algorithm: string; time_ms: number; nodes_visited: number }>;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  comparisonData,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1 items-center justify-center text-center shadow-md">
          <Zap className="text-amber-500 mb-1" size={20} />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Solve Time</span>
          <span className="text-lg font-mono font-bold text-slate-100">
            {stats ? `${stats.time_ms.toFixed(3)} ms` : "0.000 ms"}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1 items-center justify-center text-center shadow-md">
          <Activity className="text-cyan-500 mb-1" size={20} />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nodes Visited</span>
          <span className="text-lg font-mono font-bold text-slate-100">
            {stats ? stats.nodes_visited.toLocaleString() : "0"}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1 items-center justify-center text-center shadow-md">
          <Repeat className="text-rose-500 mb-1" size={20} />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Backtracks</span>
          <span className="text-lg font-mono font-bold text-slate-100">
            {stats ? stats.backtracks.toLocaleString() : "0"}
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
        <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">Algorithm Comparison</h3>
        
        {comparisonData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="algorithm" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#38bdf8" fontSize={10} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#fbbf24" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px" }}
                  labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar yAxisId="left" dataKey="time_ms" name="Time (ms)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="nodes_visited" name="Nodes Visited" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
            Run solvers to compare execution performance
          </div>
        )}
      </div>
    </div>
  );
};
