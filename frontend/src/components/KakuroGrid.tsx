import React, { useMemo } from "react";
import type { KakuroRun } from "../utils/types";

interface KakuroGridProps {
  grid: number[][];
  width: number;
  runs: KakuroRun[];
  activeCell: { r: number; c: number } | null;
  activeStatus: "try" | "backtrack" | "prune" | "unprune" | null;
}

export const KakuroGrid: React.FC<KakuroGridProps> = ({
  grid,
  width,
  runs,
  activeCell,
  activeStatus,
}) => {
  // Pre-calculate clues for black cells based on runs
  const blackCluesMap = useMemo(() => {
    const map: Record<string, { hClue?: number; vClue?: number }> = {};

    runs.forEach((run) => {
      if (run.cells.length === 0) return;
      const firstCell = run.cells[0];

      // We determine if this run is horizontal or vertical
      // If cells have the same row, it's horizontal
      const isHorizontal = run.cells.every(c => c[0] === firstCell[0]);
      
      if (isHorizontal) {
        // Horizontal clue cell is directly to the left of the first cell
        const clueR = firstCell[0];
        const clueC = firstCell[1] - 1;
        if (clueR >= 0 && clueC >= 0) {
          const key = `${clueR}-${clueC}`;
          if (!map[key]) map[key] = {};
          map[key].hClue = run.target;
        }
      } else {
        // Vertical clue cell is directly above the first cell
        const clueR = firstCell[0] - 1;
        const clueC = firstCell[1];
        if (clueR >= 0 && clueC >= 0) {
          const key = `${clueR}-${clueC}`;
          if (!map[key]) map[key] = {};
          map[key].vClue = run.target;
        }
      }
    });

    return map;
  }, [runs]);

  return (
    <div 
      className="grid gap-0.5 bg-slate-800 p-2 rounded-2xl shadow-2xl border border-slate-700 max-w-[450px] mx-auto aspect-square overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
    >
      {grid.map((row, r) =>
        row.map((val, c) => {
          const cellKey = `${r}-${c}`;
          const isBlack = val === -1;
          const isActive = activeCell && activeCell.r === r && activeCell.c === c;
          
          if (isBlack) {
            const clues = blackCluesMap[cellKey];
            const hasHClue = clues?.hClue !== undefined;
            const hasVClue = clues?.vClue !== undefined;

            return (
              <div
                key={cellKey}
                className="relative aspect-square bg-slate-950 text-slate-400 select-none overflow-hidden border border-slate-800"
              >
                {(hasHClue || hasVClue) && (
                  <>
                    {/* SVG Diagonal line split */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line x1="0" y1="0" x2="100" y2="100" stroke="#334155" strokeWidth="2" />
                    </svg>
                    
                    {/* Top Right Horizontal Clue */}
                    {hasHClue && (
                      <span className="absolute top-1 right-1.5 text-[10px] font-bold text-cyan-400">
                        {clues.hClue}
                      </span>
                    )}

                    {/* Bottom Left Vertical Clue */}
                    {hasVClue && (
                      <span className="absolute bottom-1 left-1.5 text-[10px] font-bold text-amber-500">
                        {clues.vClue}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          }

          // White cells (value display)
          let cellBg = "bg-slate-900";
          let textColor = "text-slate-100 font-medium";
          let borderGlow = "";

          if (isActive) {
            if (activeStatus === "try") {
              cellBg = "bg-emerald-950/80";
              textColor = "text-emerald-300 font-bold";
              borderGlow = "ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]";
            } else if (activeStatus === "backtrack") {
              cellBg = "bg-rose-950/80";
              textColor = "text-rose-300 font-bold";
              borderGlow = "ring-2 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]";
            }
          } else if (val !== 0) {
            textColor = "text-cyan-400 font-medium";
          }

          return (
            <div
              key={cellKey}
              className={`relative flex items-center justify-center aspect-square select-none cursor-pointer text-xl transition-all duration-150 rounded-md
                ${cellBg} ${textColor} ${borderGlow} border border-slate-800
                hover:bg-slate-700/30 active:scale-95`}
            >
              {val !== 0 ? val : ""}
            </div>
          );
        })
      )}
    </div>
  );
};
