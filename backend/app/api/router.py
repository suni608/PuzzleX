from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import time
import json

from ..database.db import get_db
from ..database.models import Puzzle, BenchmarkHistory
from ..solver_interface import run_cpp_solver
from ..generator.puzzle_gen import (
    generate_sudoku,
    generate_killer_sudoku,
    generate_kenken,
    generate_kakuro
)

router = APIRouter()

# --- Pydantic Schemas ---

class SolverParams(BaseModel):
    use_mrv: bool = False
    use_degree: bool = False
    use_lcv: bool = False
    use_fc: bool = False

class SudokuData(BaseModel):
    grid: List[List[int]]

class KillerCageData(BaseModel):
    target: int
    cells: List[List[int]]

class KillerData(BaseModel):
    grid: List[List[int]]
    cages: List[KillerCageData]

class KakuroRunData(BaseModel):
    target: int
    cells: List[List[int]]

class KakuroData(BaseModel):
    height: int
    width: int
    white_cells: List[List[int]]
    runs: List[KakuroRunData]

class KenKenCageData(BaseModel):
    target: int
    op: str # "+", "-", "*", "/", " "
    cells: List[List[int]]

class KenKenData(BaseModel):
    size: int
    cages: List[KenKenCageData]

class NQueensData(BaseModel):
    n: int

class SolveRequest(BaseModel):
    puzzle_type: str # sudoku, killer, kakuro, kenken, nqueens
    algorithm: str # backtracking, csp, dlx
    record_trace: bool = False
    params: Optional[SolverParams] = None
    sudoku: Optional[SudokuData] = None
    killer: Optional[KillerData] = None
    kakuro: Optional[KakuroData] = None
    kenken: Optional[KenKenData] = None
    nqueens: Optional[NQueensData] = None

class GenerateRequest(BaseModel):
    puzzle_type: str
    difficulty: str # easy, medium, hard, expert
    size: Optional[int] = 6 # For KenKen

class HintRequest(BaseModel):
    puzzle_type: str
    grid: List[List[int]] # Current player grid state
    # Additional specs depending on puzzle
    cages: Optional[List[Dict[str, Any]]] = None # For Killer / KenKen
    runs: Optional[List[Dict[str, Any]]] = None # For Kakuro
    white_cells: Optional[List[List[int]]] = None # For Kakuro
    size: Optional[int] = 9

# --- Solver Route ---

@router.post("/solve")
def solve_puzzle(req: SolveRequest, db: Session = Depends(get_db)):
    # Prepare payload for C++ solver
    payload = req.model_dump(exclude_none=True)
    
    res = run_cpp_solver(payload)
    
    if not res.get("solved"):
        return res
        
    # Save performance stats to DB for benchmarking
    stats = res.get("stats", {})
    if stats:
        # Extract difficulty (we can guess or pass it, default to 'custom')
        difficulty = "custom"
        
        # Save record
        history_entry = BenchmarkHistory(
            puzzle_type=req.puzzle_type,
            difficulty=difficulty,
            algorithm=req.algorithm,
            time_ms=stats.get("time_ms", 0.0),
            nodes_visited=stats.get("nodes_visited", 0),
            backtracks=stats.get("backtracks", 0)
        )
        db.add(history_entry)
        db.commit()
        
    return res

# --- Generator Route ---

@router.post("/generate")
def generate_puzzle(req: GenerateRequest, db: Session = Depends(get_db)):
    pt = req.puzzle_type.lower()
    diff = req.difficulty.lower()
    
    try:
        if pt == "sudoku":
            data = generate_sudoku(diff)
        elif pt == "killer":
            data = generate_killer_sudoku(diff)
        elif pt == "kenken":
            data = generate_kenken(req.size or 6, diff)
        elif pt == "kakuro":
            data = generate_kakuro(diff)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported puzzle type: {req.puzzle_type}")
            
        # Store in database
        puzzle_entry = Puzzle(
            puzzle_type=pt,
            difficulty=diff,
            board_data=json.dumps(data),
            solution_data=json.dumps(data.get("solution"))
        )
        db.add(puzzle_entry)
        db.commit()
        db.refresh(puzzle_entry)
        
        # Return puzzle details
        return {
            "id": puzzle_entry.id,
            "puzzle_type": pt,
            "difficulty": diff,
            "board_data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

# --- AI Hint Generator Route ---

@router.post("/hint")
def get_hint(req: HintRequest):
    grid = req.grid
    pt = req.puzzle_type.lower()
    
    # We will search for an empty cell and explain the constraint exclusions
    if pt == "sudoku":
        # 1. Analyze row, column, box constraints for each empty cell
        for r in range(9):
            for c in range(9):
                if grid[r][c] != 0:
                    continue
                    
                # Find digits already in row, col, box
                row_vals = {grid[r][i] for i in range(9) if grid[r][i] != 0}
                col_vals = {grid[i][c] for i in range(9) if grid[i][c] != 0}
                
                box_r, box_c = (r // 3) * 3, (c // 3) * 3
                box_vals = {grid[box_r + i][box_c + j] for i in range(3) for j in range(3) if grid[box_r + i][box_c + j] != 0}
                
                all_excluded = row_vals.union(col_vals).union(box_vals)
                possible = set(range(1, 10)) - all_excluded
                
                if len(possible) == 1:
                    val = list(possible)[0]
                    # Generate logical explanation
                    explanation = (
                        f"Cell at Row {r+1}, Column {c+1} must be {val}. "
                        f"Every other number is ruled out because: "
                    )
                    exclusions = []
                    for digit in range(1, 10):
                        if digit == val:
                            continue
                        reasons = []
                        if digit in row_vals:
                            reasons.append(f"Row {r+1} already contains {digit}")
                        if digit in col_vals:
                            reasons.append(f"Column {c+1} already contains {digit}")
                        if digit in box_vals:
                            reasons.append(f"Box {box_r//3*3 + box_c//3 + 1} already contains {digit}")
                        
                        if reasons:
                            exclusions.append(f"{digit} violates ({', '.join(reasons)})")
                        else:
                            exclusions.append(f"{digit} is blocked by other active cells")
                            
                    explanation += "; ".join(exclusions) + "."
                    
                    return {
                        "row": r,
                        "col": c,
                        "value": val,
                        "explanation": explanation
                    }
                    
        # If no single value cell is found, find the one with the smallest domain (e.g. 2 possibilities)
        min_cell = None
        min_possible = None
        min_len = 10
        
        for r in range(9):
            for c in range(9):
                if grid[r][c] != 0:
                    continue
                row_vals = {grid[r][i] for i in range(9) if grid[r][i] != 0}
                col_vals = {grid[i][c] for i in range(9) if grid[i][c] != 0}
                box_r, box_c = (r // 3) * 3, (c // 3) * 3
                box_vals = {grid[box_r + i][box_c + j] for i in range(3) for j in range(3) if grid[box_r + i][box_c + j] != 0}
                all_excluded = row_vals.union(col_vals).union(box_vals)
                possible = set(range(1, 10)) - all_excluded
                
                if 1 < len(possible) < min_len:
                    min_len = len(possible)
                    min_cell = (r, c)
                    min_possible = possible
                    
        if min_cell:
            r, c = min_cell
            possible_list = sorted(list(min_possible))
            return {
                "row": r,
                "col": c,
                "value": None,
                "explanation": f"Try looking at Row {r+1}, Column {c+1}. It has only {min_len} remaining possibilities: {', '.join(map(str, possible_list))}."
            }
            
    # For other puzzles, suggest focusing on specific cages or cell lists
    return {
        "row": 0,
        "col": 0,
        "value": None,
        "explanation": "Look at cages with small cell counts or lower sum targets to easily eliminate choices."
    }

# --- Benchmark Query Route ---

@router.get("/benchmark")
def get_benchmarks(db: Session = Depends(get_db)):
    results = db.query(BenchmarkHistory).all()
    
    # Format results for Recharts
    # We want charts showing execution time per puzzle type and algorithm
    chart_data = []
    
    # Group by puzzle_type and algorithm, and compute average
    groups = {}
    for entry in results:
        key = (entry.puzzle_type, entry.algorithm)
        if key not in groups:
            groups[key] = []
        groups[key].append(entry.time_ms)
        
    formatted = []
    for (pt, algo), times in groups.items():
        avg_time = sum(times) / len(times)
        formatted.append({
            "puzzle_type": pt,
            "algorithm": algo,
            "avg_time_ms": round(avg_time, 4),
            "run_count": len(times)
        })
        
    return formatted
