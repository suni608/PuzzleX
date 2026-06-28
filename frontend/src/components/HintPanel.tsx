import React from "react";
import { HelpCircle, ArrowRight } from "lucide-react";

interface HintPanelProps {
  onGetHint: () => void;
  hint: { row: number; col: number; value: number | null; explanation: string } | null;
  isLoading: boolean;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  onGetHint,
  hint,
  isLoading,
}) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <HelpCircle size={16} className="text-emerald-450" />
          AI Hint & Explanation Engine
        </h3>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Stuck? Ask the engine to find the next logically deducible move. Rather than just giving the answer, it will explain the active constraint exclusions that force it.
      </p>

      {hint && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 mt-1">
          <div className="flex items-center justify-between border-b border-b-slate-900 pb-2 mb-1">
            <span className="text-xs font-bold text-slate-300">
              Target: Cell ({hint.row + 1}, {hint.col + 1})
            </span>
            {hint.value !== null && (
              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                Value <ArrowRight size={10} /> {hint.value}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {hint.explanation}
          </p>
        </div>
      )}

      <button
        onClick={onGetHint}
        disabled={isLoading}
        className="w-full bg-slate-850 hover:bg-slate-800 text-emerald-400 border border-emerald-900/30 font-semibold py-2 px-4 rounded-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
      >
        {isLoading ? "Analyzing..." : "Get Logic Hint"}
      </button>
    </div>
  );
};
