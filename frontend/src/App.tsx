import { useState, useEffect, useRef } from "react";
import { solvePuzzle, generatePuzzle, getHint } from "./api";
import type { PuzzleType, Algorithm, SolverParams, TraceStep, SolverStats } from "./utils/types";
import { SudokuGrid } from "./components/SudokuGrid";
import { KillerGrid } from "./components/KillerGrid";
import { KenKenGrid } from "./components/KenKenGrid";
import { KakuroGrid } from "./components/KakuroGrid";
import { VisualizerControls } from "./components/VisualizerControls";
import { StatsDashboard } from "./components/StatsDashboard";
import { GeneratorControls } from "./components/GeneratorControls";
import { HintPanel } from "./components/HintPanel";
import { Play, Cpu, Layers } from "lucide-react";

// --- Predefined Starter Boards ---

const STARTER_SUDOKU = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9]
];

const STARTER_KILLER = {
  grid: Array(9).fill(0).map(() => Array(9).fill(0)),
  cages: [
    { target: 15, cells: [[0, 0], [0, 1]] },
    { target: 12, cells: [[0, 2], [1, 2]] },
    { target: 11, cells: [[0, 3], [0, 4]] },
    { target: 13, cells: [[0, 5], [1, 5], [2, 5]] },
    { target: 9,  cells: [[0, 6], [0, 7]] },
    { target: 14, cells: [[0, 8], [1, 8], [2, 8]] },
    { target: 16, cells: [[1, 0], [2, 0]] },
    { target: 7,  cells: [[1, 1], [2, 1], [2, 2]] },
    { target: 10, cells: [[1, 3], [2, 3]] },
    { target: 8,  cells: [[1, 4], [2, 4]] },
    { target: 15, cells: [[1, 6], [1, 7]] },
    { target: 14, cells: [[3, 0], [4, 0], [5, 0]] },
    { target: 8,  cells: [[3, 1], [3, 2]] },
    { target: 16, cells: [[3, 3], [4, 3]] },
    { target: 15, cells: [[3, 4], [3, 5], [4, 4]] },
    { target: 13, cells: [[3, 6], [3, 7]] },
    { target: 17, cells: [[3, 8], [4, 8]] },
    { target: 11, cells: [[4, 1], [5, 1]] },
    { target: 14, cells: [[4, 2], [5, 2]] },
    { target: 9,  cells: [[4, 5], [4, 6]] },
    { target: 8,  cells: [[4, 7], [5, 7]] },
    { target: 12, cells: [[5, 3], [5, 4], [6, 4]] },
    { target: 10, cells: [[5, 5], [6, 5]] },
    { target: 13, cells: [[5, 6], [6, 6], [7, 6]] },
    { target: 9,  cells: [[5, 8], [6, 8]] },
    { target: 14, cells: [[6, 0], [6, 1]] },
    { target: 11, cells: [[6, 2], [7, 2]] },
    { target: 15, cells: [[6, 3], [7, 3]] },
    { target: 16, cells: [[6, 7], [7, 7]] },
    { target: 12, cells: [[7, 0], [8, 0], [8, 1]] },
    { target: 13, cells: [[7, 1], [7, 2]] }, // Adjusted overlap
    { target: 10, cells: [[7, 4], [8, 4]] },
    { target: 8,  cells: [[7, 5], [8, 5]] },
    { target: 11, cells: [[7, 8], [8, 8]] },
    { target: 17, cells: [[8, 2], [8, 3]] },
    { target: 14, cells: [[8, 6], [8, 7]] }
  ]
};

const STARTER_KENKEN = {
  size: 6,
  grid: Array(6).fill(0).map(() => Array(6).fill(0)),
  cages: [
    { target: 11, op: "+", cells: [[0, 0], [1, 0]] },
    { target: 2,  op: "/", cells: [[0, 1], [0, 2]] },
    { target: 20, op: "*", cells: [[0, 3], [1, 3]] },
    { target: 6,  op: "*", cells: [[0, 4], [0, 5], [1, 5]] },
    { target: 3,  op: "-", cells: [[1, 1], [1, 2]] },
    { target: 3,  op: "/", cells: [[1, 4], [2, 4]] },
    { target: 240,op: "*", cells: [[2, 0], [2, 1], [3, 0], [3, 1]] },
    { target: 6,  op: "+", cells: [[2, 2], [2, 3]] },
    { target: 6,  op: "*", cells: [[2, 5], [3, 5]] },
    { target: 7,  op: "+", cells: [[3, 2], [4, 2], [4, 3]] },
    { target: 30, op: "*", cells: [[3, 3], [3, 4]] },
    { target: 6,  op: "*", cells: [[4, 0], [5, 0]] },
    { target: 9,  op: "+", cells: [[4, 1], [5, 1], [5, 2]] },
    { target: 2,  op: "-", cells: [[4, 4], [5, 4]] },
    { target: 8,  op: "+", cells: [[4, 5], [5, 5]] },
    { target: 2,  op: "/", cells: [[5, 3], [5, 4]] } // Adjusted to overlap safely
  ]
};

const STARTER_KAKURO = {
  height: 8,
  width: 8,
  grid: [
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [-1,  0,  0, -1, -1,  0,  0, -1],
    [-1,  0,  0,  0, -1,  0,  0,  0],
    [-1,  0,  0,  0,  0,  0,  0, -1],
    [-1, -1,  0,  0,  0,  0, -1, -1],
    [-1,  0,  0,  0,  0,  0,  0, -1],
    [-1,  0,  0,  0, -1,  0,  0,  0],
    [-1, -1, -1, -1, -1, -1, -1, -1],
  ],
  white_cells: [
    [1,1], [1,2], [1,5], [1,6],
    [2,1], [2,2], [2,3], [2,5], [2,6], [2,7],
    [3,1], [3,2], [3,3], [3,4], [3,5], [3,6],
    [4,2], [4,3], [4,4], [4,5],
    [5,1], [5,2], [5,3], [5,4], [5,5], [5,6],
    [6,1], [6,2], [6,3], [6,5], [6,6], [6,7]
  ],
  runs: [
    { target: 4, cells: [[1,1], [1,2]] },
    { target: 3, cells: [[1,5], [1,6]] },
    { target: 22, cells: [[2,1], [2,2], [2,3]] },
    { target: 12, cells: [[2,5], [2,6], [2,7]] },
    { target: 29, cells: [[3,1], [3,2], [3,3], [3,4], [3,5], [3,6]] },
    { target: 10, cells: [[4,2], [4,3], [4,4], [4,5]] },
    { target: 21, cells: [[5,1], [5,2], [5,3], [5,4], [5,5], [5,6]] },
    { target: 14, cells: [[6,1], [6,2], [6,3]] },
    { target: 8, cells: [[6,5], [6,6], [6,7]] },
    { target: 10, cells: [[1,1], [2,1], [3,1]] },
    { target: 24, cells: [[1,2], [2,2], [3,2], [4,2], [5,2], [6,2]] },
    { target: 14, cells: [[2,3], [3,3], [4,3], [5,3], [6,3]] },
    { target: 4, cells: [[3,4], [4,4], [5,4]] },
    { target: 18, cells: [[3,5], [4,5], [5,5], [6,5]] },
    { target: 20, cells: [[1,5], [2,5], [3,5]] }, // Adjusted vertical run
    { target: 23, cells: [[1,6], [2,6], [3,6], [5,6], [6,6]] },
    { target: 7, cells: [[2,7], [6,7]] }
  ]
};

export default function App() {
  const [puzzleType, setPuzzleType] = useState<PuzzleType>("sudoku");
  const [algorithm, setAlgorithm] = useState<Algorithm>("csp");
  const [params, setParams] = useState<SolverParams>({
    use_mrv: true,
    use_degree: true,
    use_lcv: true,
    use_fc: true,
  });

  // --- Grid and Puzzle State ---
  const [grid, setGrid] = useState<number[][]>(STARTER_SUDOKU);
  const [initialGrid, setInitialGrid] = useState<number[][]>(STARTER_SUDOKU);
  const [cages, setCages] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [whiteCells, setWhiteCells] = useState<any[]>([]);
  const [nQueensSize, setNQueensSize] = useState<number>(8);

  // --- Visualizer Playback State ---
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [traceIndex, setTraceIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(100);
  const [activeCell, setActiveCell] = useState<{ r: number; c: number; val?: number } | null>(null);
  const [activeStatus, setActiveStatus] = useState<"try" | "backtrack" | "prune" | "unprune" | null>(null);

  // --- UI/API State ---
  const [difficulty, setDifficulty] = useState<string>("easy");
  const [kenkenSize, setKenKenSize] = useState<number>(6);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<SolverStats | null>(null);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [hint, setHint] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const playbackTimerRef = useRef<any>(null);

  // --- Sync Starter Boards on Type Switch ---
  useEffect(() => {
    handleReset();
    setTrace([]);
    setTraceIndex(0);
    setStats(null);
    setHint(null);
    setErrorMessage("");

    if (puzzleType === "sudoku") {
      setGrid(STARTER_SUDOKU.map(r => [...r]));
      setInitialGrid(STARTER_SUDOKU.map(r => [...r]));
    } else if (puzzleType === "killer") {
      setGrid(STARTER_KILLER.grid.map(r => [...r]));
      setInitialGrid(STARTER_KILLER.grid.map(r => [...r]));
      setCages(STARTER_KILLER.cages);
    } else if (puzzleType === "kenken") {
      setGrid(STARTER_KENKEN.grid.map(r => [...r]));
      setInitialGrid(STARTER_KENKEN.grid.map(r => [...r]));
      setCages(STARTER_KENKEN.cages);
    } else if (puzzleType === "kakuro") {
      setGrid(STARTER_KAKURO.grid.map(r => [...r]));
      setInitialGrid(STARTER_KAKURO.grid.map(r => [...r]));
      setRuns(STARTER_KAKURO.runs);
      setWhiteCells(STARTER_KAKURO.white_cells);
    }
  }, [puzzleType]);

  // --- Resize N-Queens chess board ---
  useEffect(() => {
    if (puzzleType === "nqueens") {
      const empty = Array(nQueensSize).fill(0).map(() => Array(nQueensSize).fill(0));
      setGrid(empty);
      setInitialGrid(empty);
    }
  }, [nQueensSize, puzzleType]);

  // --- Trace Playback Effect ---
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setTimeout(() => {
        if (traceIndex < trace.length) {
          const step = trace[traceIndex];
          setActiveCell({ r: step.row, c: step.col, val: step.val });
          setActiveStatus(step.type);

          setGrid((prev) => {
            const next = prev.map((row) => [...row]);
            if (puzzleType === "nqueens") {
              if (step.type === "try") {
                next[step.row].fill(0);
                next[step.row][step.val] = 1;
              } else if (step.type === "backtrack") {
                next[step.row].fill(0);
              }
            } else {
              if (step.type === "try") {
                next[step.row][step.col] = step.val;
              } else if (step.type === "backtrack") {
                next[step.row][step.col] = 0;
              }
            }
            return next;
          });

          setTraceIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setActiveCell(null);
          setActiveStatus(null);
        }
      }, speed);
    }

    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, [isPlaying, traceIndex, trace, speed]);

  // --- Solver Actions ---

  const handleSolve = async () => {
    handleReset();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const puzzleData: any = {};
      if (puzzleType === "sudoku") {
        puzzleData.grid = initialGrid;
      } else if (puzzleType === "killer") {
        puzzleData.grid = initialGrid;
        puzzleData.cages = cages;
      } else if (puzzleType === "kenken") {
        puzzleData.size = kenkenSize;
        puzzleData.cages = cages;
      } else if (puzzleType === "kakuro") {
        puzzleData.height = STARTER_KAKURO.height;
        puzzleData.width = STARTER_KAKURO.width;
        puzzleData.white_cells = whiteCells;
        puzzleData.runs = runs;
      } else if (puzzleType === "nqueens") {
        puzzleData.n = nQueensSize;
      }

      const res = await solvePuzzle(puzzleType, algorithm, true, params, puzzleData);

      if (!res.solved) {
        setErrorMessage(res.error || "This puzzle is unsolvable.");
        setIsLoading(false);
        return;
      }

      setTrace(res.trace);
      setStats(res.stats);
      setTraceIndex(0);
      setIsPlaying(true);

      // Save comparison data
      setComparisonData((prev) => {
        const key = `${algorithm} ${params.use_fc ? "+ FC" : ""}`;
        const filtered = prev.filter((item) => item.algorithm !== key);
        return [
          ...filtered,
          {
            algorithm: key,
            time_ms: res.stats.time_ms,
            nodes_visited: res.stats.nodes_visited,
          },
        ];
      });
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to contact solving engine.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveCell(null);
    setActiveStatus(null);
    setTraceIndex(0);
    setGrid(initialGrid.map((r) => [...r]));
  };

  const handlePlayPause = () => {
    if (trace.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    if (traceIndex >= trace.length) return;
    const step = trace[traceIndex];
    setActiveCell({ r: step.row, c: step.col, val: step.val });
    setActiveStatus(step.type);

    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      if (puzzleType === "nqueens") {
        if (step.type === "try") {
          next[step.row].fill(0);
          next[step.row][step.val] = 1;
        } else if (step.type === "backtrack") {
          next[step.row].fill(0);
        }
      } else {
        if (step.type === "try") {
          next[step.row][step.col] = step.val;
        } else if (step.type === "backtrack") {
          next[step.row][step.col] = 0;
        }
      }
      return next;
    });

    setTraceIndex((prev) => prev + 1);
  };

  const handleStepBackward = () => {
    if (traceIndex <= 0) return;
    const prevIdx = traceIndex - 1;
    const step = trace[prevIdx];

    // Undo step
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      if (puzzleType === "nqueens") {
        if (step.type === "try") {
          next[step.row].fill(0);
        } else if (step.type === "backtrack") {
          next[step.row].fill(0);
          next[step.row][step.val] = 1;
        }
      } else {
        if (step.type === "try") {
          next[step.row][step.col] = 0;
        } else if (step.type === "backtrack") {
          next[step.row][step.col] = step.val;
        }
      }
      return next;
    });

    setActiveCell({ r: step.row, c: step.col, val: step.val });
    setActiveStatus(step.type === "try" ? "backtrack" : "try");
    setTraceIndex(prevIdx);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setHint(null);
    setTrace([]);
    setTraceIndex(0);

    try {
      const res = await generatePuzzle(puzzleType, difficulty, kenkenSize);
      const data = res.board_data;

      if (puzzleType === "sudoku") {
        setGrid(data.grid.map((r: any) => [...r]));
        setInitialGrid(data.grid.map((r: any) => [...r]));
      } else if (puzzleType === "killer") {
        setGrid(data.grid.map((r: any) => [...r]));
        setInitialGrid(data.grid.map((r: any) => [...r]));
        setCages(data.cages);
      } else if (puzzleType === "kenken") {
        setGrid(data.grid.map((r: any) => [...r]));
        setInitialGrid(data.grid.map((r: any) => [...r]));
        setCages(data.cages);
      } else if (puzzleType === "kakuro") {
        setGrid(data.grid.map((r: any) => [...r]));
        setInitialGrid(data.grid.map((r: any) => [...r]));
        setRuns(data.runs);
        setWhiteCells(data.white_cells);
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to generate puzzle.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetHint = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const extraData: any = {};
      if (puzzleType === "killer") {
        extraData.cages = cages;
      } else if (puzzleType === "kenken") {
        extraData.cages = cages;
        extraData.size = kenkenSize;
      } else if (puzzleType === "kakuro") {
        extraData.runs = runs;
        extraData.white_cells = whiteCells;
        extraData.size = STARTER_KAKURO.width;
      }

      const res = await getHint(puzzleType, grid, extraData);
      setHint(res);
    } catch (e: any) {
      setErrorMessage("Failed to generate hint.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="text-cyan-500 w-8 h-8 animate-pulse-slow" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              PuzzleX
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Constraint Satisfaction & Optimization Platform
            </p>
          </div>
        </div>

        {/* Puzzle Selector Tabs */}
        <nav className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(["sudoku", "killer", "kenken", "kakuro", "nqueens"] as PuzzleType[]).map((type) => (
            <button
              key={type}
              onClick={() => setPuzzleType(type)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all capitalize
                ${puzzleType === type 
                  ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-indigo-900/20" 
                  : "text-slate-400 hover:text-slate-200"}`}
            >
              {type === "nqueens" ? "N-Queens" : type}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 max-w-[1400px] mx-auto w-full">
        {/* Left Control Column */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* Solver Configuration */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
            <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
              <Cpu size={16} className="text-cyan-400" />
              Solver Configuration
            </h3>

            {/* Algorithm Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Algorithm</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="csp">CSP (General Constraint Solver)</option>
                {puzzleType === "sudoku" && <option value="dlx">Dancing Links (DLX / Alg X)</option>}
                {puzzleType === "sudoku" && <option value="backtracking">Naive Backtracking (DFS)</option>}
              </select>
            </div>

            {/* Heuristics Toggles (only for CSP solver) */}
            {algorithm === "csp" && (
              <div className="flex flex-col gap-3 mt-2 border-t border-t-slate-800 pt-4">
                <label className="text-[10px] text-slate-455 font-bold uppercase tracking-wider mb-1">
                  CSP Heuristics & Propagation
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={params.use_mrv}
                      onChange={(e) => setParams(p => ({ ...p, use_mrv: e.target.checked }))}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                    />
                    MRV Heuristic
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={params.use_degree}
                      onChange={(e) => setParams(p => ({ ...p, use_degree: e.target.checked }))}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                    />
                    Degree Heuristic
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={params.use_lcv}
                      onChange={(e) => setParams(p => ({ ...p, use_lcv: e.target.checked }))}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                    />
                    LCV Heuristic
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={params.use_fc}
                      onChange={(e) => setParams(p => ({ ...p, use_fc: e.target.checked }))}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                    />
                    Forward Checking
                  </label>
                </div>
              </div>
            )}

            <button
              onClick={handleSolve}
              disabled={isLoading || (puzzleType === "nqueens" && isPlaying)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-cyan-950/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 mt-2 flex items-center justify-center gap-2 text-sm"
            >
              <Play size={16} />
              {isLoading ? "Solving..." : "Run Puzzle Solver"}
            </button>
          </div>

          {/* Generator Controls */}
          {puzzleType !== "nqueens" && (
            <GeneratorControls
              puzzleType={puzzleType}
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              kenkenSize={kenkenSize}
              onKenKenSizeChange={setKenKenSize}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          )}

          {/* N-Queens configuration selector */}
          {puzzleType === "nqueens" && (
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
              <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">Queens Settings</h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Chessboard Size (N)</label>
                <input
                  type="number"
                  min={4}
                  max={20}
                  value={nQueensSize}
                  onChange={(e) => setNQueensSize(Math.max(4, Number(e.target.value)))}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {/* AI Hint Panel */}
          {puzzleType !== "nqueens" && (
            <HintPanel
              onGetHint={handleGetHint}
              hint={hint}
              isLoading={isLoading}
            />
          )}
        </section>

        {/* Center Grid Visualizer Column */}
        <section className="lg:col-span-5 flex flex-col gap-6 justify-center">
          <div className="flex flex-col items-center gap-4 bg-slate-900/35 border border-slate-850 p-8 rounded-3xl shadow-lg relative min-h-[500px] justify-center">
            {errorMessage && (
              <div className="bg-rose-950/80 border border-rose-900/40 text-rose-300 px-4 py-3 rounded-xl text-xs w-full text-center mb-4">
                {errorMessage}
              </div>
            )}

            {/* Switchable grids */}
            {puzzleType === "sudoku" && (
              <SudokuGrid
                grid={grid}
                initialGrid={initialGrid}
                activeCell={activeCell}
                activeStatus={activeStatus}
              />
            )}

            {puzzleType === "killer" && (
              <KillerGrid
                grid={grid}
                initialGrid={initialGrid}
                cages={cages}
                activeCell={activeCell}
                activeStatus={activeStatus}
              />
            )}

            {puzzleType === "kenken" && (
              <KenKenGrid
                grid={grid}
                initialGrid={initialGrid}
                cages={cages}
                size={kenkenSize}
                activeCell={activeCell}
                activeStatus={activeStatus}
              />
            )}

            {puzzleType === "kakuro" && (
              <KakuroGrid
                grid={grid}
                width={STARTER_KAKURO.width}
                runs={runs}
                activeCell={activeCell}
                activeStatus={activeStatus}
              />
            )}

            {puzzleType === "nqueens" && (
              <div className="flex flex-col items-center gap-4 w-full">
                <div 
                  className="grid gap-0.5 bg-slate-800 p-2 rounded-2xl shadow-xl border border-slate-700 w-full max-w-[400px] aspect-square"
                  style={{ gridTemplateColumns: `repeat(${nQueensSize}, minmax(0, 1fr))` }}
                >
                  {Array(nQueensSize).fill(0).map((_, r) =>
                    Array(nQueensSize).fill(0).map((_, c) => {
                      // Determine cell color for chessboard checkerboard
                      const isDark = (r + c) % 2 === 1;
                      const cellBg = isDark ? "bg-slate-950" : "bg-slate-800";
                      
                      // Check if a queen is placed here (during trace playback or solution)
                      // If solving is active, activeCell row matches r, and cell value col is c
                      const isQueen = grid[r] && grid[r][c] === 1;
                      
                      const isActive = activeCell && activeCell.r === r && activeCell.val === c;
                      
                      let highlight = "";
                      if (isActive) {
                        highlight = activeStatus === "try" ? "ring-2 ring-emerald-500 shadow-lg" : "ring-2 ring-rose-500 shadow-lg";
                      }

                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`relative flex items-center justify-center aspect-square select-none rounded ${cellBg} ${highlight}`}
                        >
                          {isQueen && (
                            <span className="text-xl font-bold text-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                              ♛
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Visualizer Controls */}
          {puzzleType !== "nqueens" && (
            <VisualizerControls
              onPlayPause={handlePlayPause}
              isPlaying={isPlaying}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onReset={handleReset}
              speed={speed}
              onSpeedChange={setSpeed}
              currentStep={traceIndex}
              totalSteps={trace.length}
            />
          )}
        </section>

        {/* Right Stats Dashboard Column */}
        <section className="lg:col-span-3">
          <StatsDashboard
            stats={stats}
            comparisonData={comparisonData}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 p-6 text-center text-xs text-slate-500">
        &copy; 2026 PuzzleX Constraint & optimization engines. Pair programmed with Antigravity.
      </footer>
    </div>
  );
}
