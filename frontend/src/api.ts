import type { SolveResult, PuzzleType, Algorithm, SolverParams } from "./utils/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export async function solvePuzzle(
  puzzleType: PuzzleType,
  algorithm: Algorithm,
  recordTrace: boolean,
  params: SolverParams,
  puzzleData: any
): Promise<SolveResult> {
  const payload: any = {
    puzzle_type: puzzleType,
    algorithm,
    record_trace: recordTrace,
    params,
  };

  if (puzzleType === "sudoku") {
    payload.sudoku = { grid: puzzleData.grid };
  } else if (puzzleType === "killer") {
    payload.killer = { grid: puzzleData.grid, cages: puzzleData.cages };
  } else if (puzzleType === "kenken") {
    payload.kenken = { size: puzzleData.size, cages: puzzleData.cages };
  } else if (puzzleType === "kakuro") {
    payload.kakuro = {
      height: puzzleData.height,
      width: puzzleData.width,
      white_cells: puzzleData.white_cells,
      runs: puzzleData.runs,
    };
  } else if (puzzleType === "nqueens") {
    payload.nqueens = { n: puzzleData.n };
  }

  const response = await fetch(`${API_BASE}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API solve error: ${response.statusText}`);
  }

  return response.json();
}

export async function generatePuzzle(
  puzzleType: PuzzleType,
  difficulty: string,
  size?: number
): Promise<any> {
  const payload = {
    puzzle_type: puzzleType,
    difficulty,
    size,
  };

  const response = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API generate error: ${response.statusText}`);
  }

  return response.json();
}

export async function getHint(
  puzzleType: PuzzleType,
  grid: number[][],
  extraData?: any
): Promise<any> {
  const payload = {
    puzzle_type: puzzleType,
    grid,
    ...extraData,
  };

  const response = await fetch(`${API_BASE}/hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API hint error: ${response.statusText}`);
  }

  return response.json();
}

export async function getBenchmarks(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/benchmark`);
  if (!response.ok) {
    throw new Error(`API benchmark error: ${response.statusText}`);
  }
  return response.json();
}
