import React from "react";

interface SudokuGridProps {
  grid: number[][];
  initialGrid: number[][];
  activeCell: { r: number; c: number } | null;
  activeStatus: "try" | "backtrack" | "prune" | "unprune" | null;
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({
  grid,
  initialGrid,
  activeCell,
  activeStatus,
}) => {
  return (
    <div className="grid grid-cols-9 gap-0.5 bg-slate-800 p-2 rounded-2xl shadow-2xl border border-slate-700 max-w-[450px] mx-auto aspect-square overflow-hidden">
      {grid.map((row, r) =>
        row.map((val, c) => {
          const isInitial = initialGrid[r] && initialGrid[r][c] !== 0;
          const isActive = activeCell && activeCell.r === r && activeCell.c === c;
          
          let cellBg = "bg-slate-900";
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

          // Compute box border lines
          const borderRight = (c === 2 || c === 5) ? "border-r-2 border-r-slate-600" : "";
          const borderBottom = (r === 2 || r === 5) ? "border-b-2 border-b-slate-600" : "";

          return (
            <div
              key={`${r}-${c}`}
              className={`relative flex items-center justify-center aspect-square select-none cursor-pointer text-xl transition-all duration-150 rounded-md
                ${cellBg} ${textColor} ${borderGlow} ${borderRight} ${borderBottom}
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
