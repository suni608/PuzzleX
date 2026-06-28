import React from "react";
import type { PuzzleType } from "../utils/types";
import { Sparkles } from "lucide-react";

interface GeneratorControlsProps {
  puzzleType: PuzzleType;
  difficulty: string;
  onDifficultyChange: (diff: string) => void;
  kenkenSize: number;
  onKenKenSizeChange: (size: number) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const GeneratorControls: React.FC<GeneratorControlsProps> = ({
  puzzleType,
  difficulty,
  onDifficultyChange,
  kenkenSize,
  onKenKenSizeChange,
  onGenerate,
  isLoading,
}) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
      <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
        <Sparkles size={16} className="text-cyan-400" />
        Puzzle Generator
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Difficulty Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        {/* KenKen Size Select */}
        {puzzleType === "kenken" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Grid Size</label>
            <select
              value={kenkenSize}
              onChange={(e) => onKenKenSizeChange(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value={4}>4 x 4</option>
              <option value={5}>5 x 5</option>
              <option value={6}>6 x 6</option>
              <option value={7}>7 x 7</option>
              <option value={8}>8 x 8</option>
              <option value={9}>9 x 9</option>
            </select>
          </div>
        )}
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 mt-2 flex items-center justify-center gap-2"
      >
        {isLoading ? "Generating..." : "Generate Puzzle"}
      </button>
    </div>
  );
};
