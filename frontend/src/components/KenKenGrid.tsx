import React, { useMemo } from "react";
import type { KenKenCage } from "../utils/types";

interface KenKenGridProps {
  grid: number[][];
  initialGrid: number[][];
  cages: KenKenCage[];
  size: number;
  activeCell: { r: number; c: number } | null;
  activeStatus: "try" | "backtrack" | "prune" | "unprune" | null;
}

export const KenKenGrid: React.FC<KenKenGridProps> = ({
  grid,
  initialGrid,
  cages,
  size,
  activeCell,
  activeStatus,
}) => {
  // Map cells to cage details and colors
  const cellMap = useMemo(() => {
    const map: Record<string, { cageIdx: number; isTopLeft: boolean; target: number; op: string }> = {};
    
    cages.forEach((cage, idx) => {
      // Find top-left cell of cage to display target and operator
      let topLeftCell = cage.cells[0];
      for (const cell of cage.cells) {
        if (cell[0] < topLeftCell[0] || (cell[0] === topLeftCell[0] && cell[1] < topLeftCell[1])) {
          topLeftCell = cell;
        }
      }
      
      cage.cells.forEach(([r, c]) => {
        map[`${r}-${c}`] = {
          cageIdx: idx,
          isTopLeft: r === topLeftCell[0] && c === topLeftCell[1],
          target: cage.target,
          op: cage.op,
        };
      });
    });
    
    return map;
  }, [cages]);

  // Generate cage colors using HSL for nice pastels
  const cageColors = useMemo(() => {
    return cages.map((_, idx) => {
      const hue = (idx * 137.5) % 360; // Golden angle
      return `hsla(${hue}, 40%, 30%, 0.15)`; // Subtle tint
    });
  }, [cages]);

  return (
    <div 
      className="grid gap-0.5 bg-slate-800 p-2 rounded-2xl shadow-2xl border border-slate-700 max-w-[450px] mx-auto aspect-square overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {grid.map((row, r) =>
        row.map((val, c) => {
          const cellKey = `${r}-${c}`;
          const cageInfo = cellMap[cellKey];
          const isInitial = initialGrid[r] && initialGrid[r][c] !== 0;
          const isActive = activeCell && activeCell.r === r && activeCell.c === c;
          
          let cellBg = cageInfo ? "" : "bg-slate-900";
          let textColor = "text-slate-100";
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
          } else if (isInitial) {
            cellBg = "bg-slate-800/50";
            textColor = "text-indigo-200 font-semibold";
          } else if (val !== 0) {
            textColor = "text-cyan-400 font-medium";
          }

          // Calculate dashed border borders based on adjacent cells in the same cage
          const currentCageIdx = cageInfo?.cageIdx;
          const borderTopDash = r > 0 && cellMap[`${r-1}-${c}`]?.cageIdx !== currentCageIdx ? "border-t border-t-dashed border-t-slate-500" : "";
          const borderBottomDash = r < size - 1 && cellMap[`${r+1}-${c}`]?.cageIdx !== currentCageIdx ? "border-b border-b-dashed border-b-slate-500" : "";
          const borderLeftDash = c > 0 && cellMap[`${r}-${c-1}`]?.cageIdx !== currentCageIdx ? "border-l border-l-dashed border-l-slate-500" : "";
          const borderRightDash = c < size - 1 && cellMap[`${r}-${c+1}`]?.cageIdx !== currentCageIdx ? "border-r border-r-dashed border-r-slate-500" : "";

          const inlineStyle = !isActive && cageInfo ? { backgroundColor: cageColors[cageInfo.cageIdx] } : undefined;

          return (
            <div
              key={cellKey}
              style={inlineStyle}
              className={`relative flex items-center justify-center aspect-square select-none cursor-pointer text-xl transition-all duration-150 rounded-md
                ${cellBg || "bg-slate-900/90"} ${textColor} ${borderGlow}
                ${borderTopDash} ${borderBottomDash} ${borderLeftDash} ${borderRightDash}
                hover:bg-slate-700/30 active:scale-95`}
            >
              {/* KenKen operator hint in top-left cell */}
              {cageInfo?.isTopLeft && (
                <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-indigo-400 select-none">
                  {cageInfo.target}
                  {cageInfo.op}
                </span>
              )}
              {val !== 0 ? val : ""}
            </div>
          );
        })
      )}
    </div>
  );
};
