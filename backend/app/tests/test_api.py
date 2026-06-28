import sys
import os
import pytest
import json

# Add parent directory to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.solver_interface import run_cpp_solver
from app.generator.puzzle_gen import generate_sudoku, generate_killer_sudoku, generate_kenken, generate_kakuro

def test_sudoku_backtracking():
    # A simple valid Sudoku puzzle (with some pre-filled values)
    grid = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ]

    payload = {
        "puzzle_type": "sudoku",
        "algorithm": "backtracking",
        "record_trace": False,
        "sudoku": {"grid": grid}
    }
    
    res = run_cpp_solver(payload)
    assert res.get("solved") is True
    assert res["solution"][0][0] == 5
    assert res["solution"][0][2] == 4 # Standard solution cell value

def test_sudoku_dlx():
    grid = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ]

    payload = {
        "puzzle_type": "sudoku",
        "algorithm": "dlx",
        "record_trace": True,
        "sudoku": {"grid": grid}
    }
    
    res = run_cpp_solver(payload)
    assert res.get("solved") is True
    assert len(res["trace"]) > 0

def test_sudoku_csp():
    grid = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ]

    payload = {
        "puzzle_type": "sudoku",
        "algorithm": "csp",
        "record_trace": False,
        "params": {
            "use_mrv": True,
            "use_degree": True,
            "use_lcv": True,
            "use_fc": True
        },
        "sudoku": {"grid": grid}
    }
    
    res = run_cpp_solver(payload)
    assert res.get("solved") is True

def test_nqueens():
    payload = {
        "puzzle_type": "nqueens",
        "algorithm": "csp",
        "record_trace": False,
        "params": {
            "use_mrv": True,
            "use_fc": True
        },
        "nqueens": {"n": 8}
    }
    
    res = run_cpp_solver(payload)
    assert res.get("solved") is True
    assert len(res["solution"]) == 8

def test_generators():
    sudoku = generate_sudoku("easy")
    assert len(sudoku["grid"]) == 9
    assert len(sudoku["solution"]) == 9

    killer = generate_killer_sudoku("medium")
    assert len(killer["grid"]) == 9
    assert len(killer["cages"]) > 0

    kenken = generate_kenken(4, "hard")
    assert len(kenken["grid"]) == 4
    assert len(kenken["cages"]) > 0
