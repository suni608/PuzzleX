# PuzzleX – Constraint Satisfaction & Optimization Platform

**Tagline:** A high-performance puzzle solving and optimization engine supporting multiple NP-complete and constraint satisfaction problems.

PuzzleX is a hybrid software architecture combining a high-performance C++ solving core with a Python FastAPI server and an interactive React-TypeScript visualization dashboard.

---

## Architecture Diagram

```
                React Frontend (Vite + TS + Tailwind CSS)
                     │
          ┌──────────┴──────────┐
          │                     │
     Puzzle Visualizer      Performance Dashboard
          │                     │
          └──────────┬──────────┘
                     │ (JSON HTTP REST API)
              FastAPI Backend (Python)
                     │ (Subprocess / JSON stdin-stdout)
         C++ Solver Engine (solver.exe)
 ┌────────────┬────────────┬─────────────┬─────────────┐
 │            │            │             │             │
Sudoku     Kakuro      Killer        KenKen        N-Queens
Solver      Solver      Sudoku        Solver        Solver
 │            │            │             │             │
 └────────────┴────────────┴─────────────┴─────────────┘
                     │
         Constraint Solver Engine (CSP)
 ┌────────────┬─────────────┬────────────┬─────────────┐
 │            │             │            │             │
Backtracking  CSP Engine    DLX      Heuristics    Tracers
 (Baseline)   (MRV/LCV/Deg) (Alg X)  (FC/ArcCons)
```

---

## Key Features

1. **High-Performance C++ Core:** The solving algorithms (naive backtracking, generic CSP engine with heuristics, and Dancing Links/DLX Algorithm X) are implemented in pure C++17, compiled with `-O3` optimization.
2. **Generic Constraint Engine:** A customizable `CSPSolver` supporting `AllDifferent`, `Sum`, and operator-based constraints that solves Sudoku, Killer Sudoku, Kakuro, KenKen, and N-Queens without code modifications.
3. **Dancing Links (DLX):** Maps Sudoku to the Exact Cover Problem and solves it in microseconds using circular doubly linked lists. Supports uniqueness verification for puzzle generation.
4. **Step-by-Step Visualization:** Backend solvers capture a trace of assignments, prunings, and backtracks, which the React visualizer plays back with controllable speed, step-by-step play, and visual indicators (green for tries, red for backtracks).
5. **AI Hint & Explanation Engine:** Inspects active constraints in real-time to explain why a number is forced in a cell or why other candidates violate specific constraints.
6. **Performance Benchmarking:** Records solving statistics (time in ms, search nodes visited, backtracks) and displays comparative graphs (using Recharts).

---

## Folder Structure

```
PuzzleX/
├── cpp_engine/
│   ├── src/
│   │   ├── main.cpp                  # CLI entry point & JSON serializer
│   │   ├── json.hpp                  # nlohmann/json library
│   │   ├── solvers/
│   │   │   ├── base_solver.hpp       # Base solver structures
│   │   │   ├── backtracking_sudoku.hpp # Baseline DFS
│   │   │   ├── csp_solver.hpp        # Generic CSP & Heuristics (MRV/Deg/LCV/FC)
│   │   │   └── dlx_solver.hpp        # Knuth's Algorithm X (DLX)
│   │   └── puzzles/
│   │       ├── sudoku.hpp            # Sudoku CSP mapping
│   │       ├── killer.hpp            # Killer Sudoku CSP mapping
│   │       ├── kakuro.hpp            # Kakuro CSP mapping
│   │       ├── kenken.hpp            # KenKen CSP mapping
│   │       └── nqueens.hpp           # N-Queens CSP mapping
│   └── solver.exe                    # Compiled optimized binary
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── router.py             # FastAPI routes
│   │   ├── database/
│   │   │   ├── db.py                 # SQLite configuration
│   │   │   └── models.py             # Database schemas
│   │   ├── generator/
│   │   │   └── puzzle_gen.py         # Boards generator
│   │   ├── tests/
│   │   │   └── test_api.py           # Subprocess & Solvers pytest suite
│   │   ├── main.py                   # FastAPI initialization
│   │   └── solver_interface.py       # Subprocess bridge to C++
│   ├── requirements.txt
│   └── run.py                        # Dev runner
└── frontend/                         # Vite + React + TS + Tailwind CSS v4
```

---

## Setup & Running Instructions

### 1. Compile C++ Solving Engine
Open your terminal inside `cpp_engine/src` and compile using `g++` (requires C++17 support):
```bash
g++ -O3 -std=c++17 main.cpp -o ../solver.exe
```

### 2. Run Python Backend
Open terminal in `backend/`:
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run pytest to verify C++ integration
pytest app/tests/

# Start FastAPI server
python run.py
```
The API documentation will be available at `http://127.0.0.1:8000/docs`.

### 3. Run React Frontend
Open terminal in `frontend/`:
```bash
# Install package dependencies
npm install

# Start Vite React dev server
npm run dev
```
The application dashboard will launch at `http://localhost:5173`.
