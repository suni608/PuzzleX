export type PuzzleType = "sudoku" | "killer" | "kakuro" | "kenken" | "nqueens";
export type Algorithm = "backtracking" | "csp" | "dlx";

export interface SolverParams {
  use_mrv: boolean;
  use_degree: boolean;
  use_lcv: boolean;
  use_fc: boolean;
}

export interface TraceStep {
  type: "try" | "backtrack" | "prune" | "unprune";
  row: number;
  col: number;
  val: number;
  domain?: number[];
}

export interface SolverStats {
  time_ms: number;
  nodes_visited: number;
  backtracks: number;
}

export interface SolveResult {
  solved: boolean;
  solution: any;
  stats: SolverStats;
  trace: TraceStep[];
  error?: string;
}

export interface SudokuBoard {
  grid: number[][];
}

export interface KillerCage {
  target: number;
  cells: [number, number][];
}

export interface KillerBoard {
  grid: number[][];
  cages: KillerCage[];
  solution?: number[][];
}

export interface KenKenCage {
  target: number;
  op: string; // "+", "-", "*", "/", " "
  cells: [number, number][];
}

export interface KenKenBoard {
  size: number;
  grid: number[][];
  cages: KenKenCage[];
  solution?: number[][];
}

export interface KakuroRun {
  target: number;
  cells: [number, number][];
}

export interface KakuroBoard {
  height: number;
  width: number;
  white_cells: [number, number][];
  runs: KakuroRun[];
  grid: number[][];
  solution?: number[][];
}
