import React from "react";
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from "lucide-react";

interface VisualizerControlsProps {
  onPlayPause: () => void;
  isPlaying: boolean;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentStep: number;
  totalSteps: number;
}

export const VisualizerControls: React.FC<VisualizerControlsProps> = ({
  onPlayPause,
  isPlaying,
  onStepForward,
  onStepBackward,
  onReset,
  speed,
  onSpeedChange,
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">Playback Controls</h3>
        <span className="text-xs font-mono text-slate-400 bg-slate-850 px-2.5 py-1 rounded-full border border-slate-800">
          Step {currentStep} / {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-cyan-500 h-1.5 rounded-full transition-all duration-100"
          style={{ width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onStepBackward}
            disabled={currentStep === 0 || isPlaying}
            className="p-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
            title="Step Backward"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={onPlayPause}
            disabled={totalSteps === 0}
            className="p-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30 disabled:opacity-40 disabled:hover:bg-cyan-600 transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={onStepForward}
            disabled={currentStep === totalSteps || isPlaying}
            className="p-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
            title="Step Forward"
          >
            <SkipForward size={18} />
          </button>

          <button
            onClick={onReset}
            disabled={currentStep === 0 && !isPlaying}
            className="p-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
            title="Reset Grid"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center gap-3 flex-1 min-w-[150px]">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Delay: {speed}ms</span>
          <input
            type="range"
            min="5"
            max="1000"
            step="5"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>
    </div>
  );
};
