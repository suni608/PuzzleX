import random
from ..solver_interface import run_cpp_solver

def generate_sudoku(difficulty: str) -> dict:
    """
    Generates a standard Sudoku puzzle of the specified difficulty.
    """
    # 1. Start with an empty grid
    grid = [[0 for _ in range(9)] for _ in range(9)]
    
    # 2. Fill diagonal boxes (independent boxes 0, 4, 8) with random permutations
    for b in range(3):
        box_r, box_c = b * 3, b * 3
        nums = list(range(1, 10))
        random.shuffle(nums)
        idx = 0
        for r in range(3):
            for c in range(3):
                grid[box_r + r][box_c + c] = nums[idx]
                idx += 1
                
    # 3. Use C++ DLX solver to fill the rest of the board
    payload = {
        "puzzle_type": "sudoku",
        "algorithm": "dlx",
        "record_trace": False,
        "sudoku": {"grid": grid}
    }
    res = run_cpp_solver(payload)
    if not res.get("solved"):
        # Fallback to empty grid generation if solver fails
        return {"grid": grid, "solution": grid}
        
    solved_grid = res["solution"]
    
    # 4. Remove cells one by one to create the puzzle, checking uniqueness
    puzzle_grid = [row[:] for row in solved_grid]
    cells = [(r, c) for r in range(9) for c in range(9)]
    random.shuffle(cells)
    
    # Target clues by difficulty
    difficulty_targets = {
        "easy": 40,    # ~41 blanks
        "medium": 32,  # ~49 blanks
        "hard": 26,    # ~55 blanks
        "expert": 18   # ~63 blanks
    }
    min_clues = difficulty_targets.get(difficulty.lower(), 30)
    
    removed_count = 0
    target_removals = 81 - min_clues
    
    for r, c in cells:
        if removed_count >= target_removals:
            break
            
        temp = puzzle_grid[r][c]
        puzzle_grid[r][c] = 0
        
        # Test uniqueness using C++ DLX solver
        check_payload = {
            "puzzle_type": "sudoku",
            "algorithm": "dlx",
            "check_uniqueness": True,
            "record_trace": False,
            "sudoku": {"grid": puzzle_grid}
        }
        check_res = run_cpp_solver(check_payload)
        
        if check_res.get("unique", False):
            removed_count += 1
        else:
            # Restore value if removing it leads to multiple solutions
            puzzle_grid[r][c] = temp
            
    return {
        "grid": puzzle_grid,
        "solution": solved_grid
    }

def generate_killer_sudoku(difficulty: str) -> dict:
    """
    Generates a Killer Sudoku puzzle. Cages constrain the entire board.
    Grid cells start blank (0s), and the cages carry target sums.
    """
    # 1. Generate a solved standard Sudoku board
    sudoku_puzzle = generate_sudoku("easy") # just to get a valid grid
    solution = sudoku_puzzle["solution"]
    
    # 2. Perform randomized flood-fill to group cells into cages of size 2-5
    cages = []
    visited = [[False for _ in range(9)] for _ in range(9)]
    
    # List of all coordinates
    cells = [(r, c) for r in range(9) for c in range(9)]
    random.shuffle(cells)
    
    for r, c in cells:
        if visited[r][c]:
            continue
            
        # Decide cage size (randomly 2 to 5)
        # Higher difficulty can have larger cages
        max_size = random.choice([2, 3, 4, 5])
        cage_cells = [(r, c)]
        visited[r][c] = True
        
        # BFS to find neighbors
        queue = [(r, c)]
        random.shuffle(queue)
        
        while queue and len(cage_cells) < max_size:
            curr_r, curr_c = queue.pop(0)
            
            # Check neighbors
            neighbors = []
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = curr_r + dr, curr_c + dc
                if 0 <= nr < 9 and 0 <= nc < 9 and not visited[nr][nc]:
                    # In Killer Sudoku, cells in a cage must contain unique numbers.
                    # Since we build from a solved Sudoku, uniqueness is guaranteed
                    # if the cells are in different rows, columns, and boxes.
                    # Standard Sudoku rules already cover this, but to be safe, we check
                    # that the value in the solution isn't already in the cage (usually satisfied)
                    val = solution[nr][nc]
                    if val not in [solution[cr][cc] for cr, cc in cage_cells]:
                        neighbors.append((nr, nc))
                        
            if neighbors:
                random.shuffle(neighbors)
                selected = neighbors[0]
                cage_cells.append(selected)
                visited[selected[0]][selected[1]] = True
                queue.append(selected)
                random.shuffle(queue)
                
        # Calculate sum
        target_sum = sum(solution[cr][cc] for cr, cc in cage_cells)
        cages.append({
            "target": target_sum,
            "cells": cage_cells
        })
        
    # Return empty grid (clues are inside cages) and solution
    empty_grid = [[0 for _ in range(9)] for _ in range(9)]
    return {
        "grid": empty_grid,
        "cages": cages,
        "solution": solution
    }

def generate_kenken(size: int, difficulty: str) -> dict:
    """
    Generates a KenKen puzzle of size N x N.
    """
    # 1. Generate a solved Latin Square of size N x N
    # We do this by filling first row randomly and running CSP solver to complete it
    grid = [[0 for _ in range(size)] for _ in range(size)]
    first_row = list(range(1, size + 1))
    random.shuffle(first_row)
    grid[0] = first_row
    
    # Define cages representing a dummy single cell cage to let CSP solver run
    # (Since KenKen CSP solver needs cages, we can pass single cell cages for row 0)
    dummy_cages = [{"target": val, "op": " ", "cells": [[0, c]]} for c, val in enumerate(first_row)]
    
    payload = {
        "puzzle_type": "kenken",
        "algorithm": "csp",
        "record_trace": False,
        "kenken": {
            "size": size,
            "cages": dummy_cages
        },
        "params": {"use_mrv": True, "use_fc": True}
    }
    
    res = run_cpp_solver(payload)
    if not res.get("solved"):
        # Fallback grid if solver fails
        solution = [[((r + c) % size) + 1 for c in range(size)] for r in range(size)]
    else:
        solution = res["solution"]
        
    # 2. Group cells into cages using flood-fill
    cages = []
    visited = [[False for _ in range(size)] for _ in range(size)]
    
    cells = [(r, c) for r in range(size) for c in range(size)]
    random.shuffle(cells)
    
    for r, c in cells:
        if visited[r][c]:
            continue
            
        # Decide cage size (1 to 4)
        max_size = random.choices([1, 2, 3, 4], weights=[10, 50, 30, 10])[0]
        cage_cells = [(r, c)]
        visited[r][c] = True
        
        queue = [(r, c)]
        while queue and len(cage_cells) < max_size:
            curr_r, curr_c = queue.pop(0)
            
            neighbors = []
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = curr_r + dr, curr_c + dc
                if 0 <= nr < size and 0 <= nc < size and not visited[nr][nc]:
                    neighbors.append((nr, nc))
                    
            if neighbors:
                random.shuffle(neighbors)
                selected = neighbors[0]
                cage_cells.append(selected)
                visited[selected[0]][selected[1]] = True
                queue.append(selected)
                random.shuffle(queue)
                
        # 3. Determine mathematical operator
        cage_vals = [solution[cr][cc] for cr, cc in cage_cells]
        if len(cage_cells) == 1:
            op = " "
            target = cage_vals[0]
        elif len(cage_cells) == 2:
            val1, val2 = cage_vals[0], cage_vals[1]
            # Try division, then subtraction, then random of (+, *)
            if val1 % val2 == 0 or val2 % val1 == 0:
                op = "/"
                target = int(val1 / val2) if val1 > val2 else int(val2 / val1)
            else:
                op = random.choice(["-", "+", "*"])
                if op == "-":
                    target = abs(val1 - val2)
                elif op == "+":
                    target = val1 + val2
                else:
                    target = val1 * val2
        else:
            # size > 2: only + or *
            op = random.choice(["+", "*"])
            if op == "+":
                target = sum(cage_vals)
            else:
                target = 1
                for v in cage_vals:
                    target *= v
                    
        cages.append({
            "target": target,
            "op": op,
            "cells": cage_cells
        })
        
    empty_grid = [[0 for _ in range(size)] for _ in range(size)]
    return {
        "grid": empty_grid,
        "cages": cages,
        "solution": solution
    }

def generate_kakuro(difficulty: str) -> dict:
    """
    Generates a Kakuro puzzle on an 8x8 grid.
    Uses a standard puzzle board template with white and black cells.
    """
    height, width = 8, 8
    # Template: 1 = White (to be filled), 0 = Black (clues or dividers)
    template = [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 1, 1, 0],
        [0, 1, 1, 1, 0, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ]
    
    white_cells = []
    for r in range(height):
        for c in range(width):
            if template[r][c] == 1:
                white_cells.append((r, c))
                
    # Fill white cells with valid unique numbers in runs.
    # To keep it simple and correct, we can populate white cells with random digits 1-9
    # while ensuring they satisfy Kakuro uniqueness on consecutive row/col runs.
    # We can do this by executing the Kakuro CSP solver on a random grid!
    # First, let's identify runs from the template.
    runs = []
    
    # 1. Identify Horizontal Runs
    for r in range(height):
        c = 0
        while c < width:
            if template[r][c] == 1:
                run_cells = []
                while c < width and template[r][c] == 1:
                    run_cells.append((r, c))
                    c += 1
                if len(run_cells) >= 2:
                    runs.append({"cells": run_cells, "dir": "h"})
            else:
                c += 1
                
    # 2. Identify Vertical Runs
    for c in range(width):
        r = 0
        while r < height:
            if template[r][c] == 1:
                run_cells = []
                while r < height and template[r][c] == 1:
                    run_cells.append((r, c))
                    r += 1
                if len(run_cells) >= 2:
                    runs.append({"cells": run_cells, "dir": "v"})
            else:
                r += 1
                
    # 3. Solve the runs to get a valid solution layout.
    # Since we don't have targets yet, we want to construct a valid Kakuro board (Latin-like runs).
    # We can assign random numbers and solve it, or just generate a grid of numbers
    # where runs are unique, and then calculate targets.
    # A simple way to get unique digits in runs:
    # Fill white cells with random values and verify they satisfy run uniqueness.
    # If not, swap or backtrack. Or we can just use the CSP solver with target sums equal to 0 (meaning no sum constraint, just uniqueness constraint).
    # To implement this easily:
    solution_grid = [[0 for _ in range(width)] for _ in range(height)]
    
    # We will populate the white cells row by row with backtracking to ensure row/col run uniqueness
    def solve_runs_only(idx):
        if idx == len(white_cells):
            return True
        r, c = white_cells[idx]
        
        # Shuffle values 1-9
        vals = list(range(1, 10))
        random.shuffle(vals)
        
        for val in vals:
            solution_grid[r][c] = val
            
            # Check uniqueness in horizontal run containing (r, c)
            h_ok = True
            # Find horizontal run cells
            hr_cells = []
            # go left
            curr_c = c
            while curr_c >= 0 and template[r][curr_c] == 1:
                hr_cells.append((r, curr_c))
                curr_c -= 1
            # go right
            curr_c = c + 1
            while curr_c < width and template[r][curr_c] == 1:
                hr_cells.append((r, curr_c))
                curr_c += 1
            
            # Check unique
            h_vals = [solution_grid[cr][cc] for cr, cc in hr_cells if solution_grid[cr][cc] != 0]
            if len(h_vals) != len(set(h_vals)):
                h_ok = False
                
            # Check uniqueness in vertical run containing (r, c)
            v_ok = True
            vr_cells = []
            # go up
            curr_r = r
            while curr_r >= 0 and template[curr_r][c] == 1:
                vr_cells.append((curr_r, c))
                curr_r -= 1
            # go down
            curr_r = r + 1
            while curr_r < height and template[curr_r][c] == 1:
                vr_cells.append((curr_r, c))
                curr_r += 1
                
            v_vals = [solution_grid[cr][cc] for cr, cc in vr_cells if solution_grid[cr][cc] != 0]
            if len(v_vals) != len(set(v_vals)):
                v_ok = False
                
            if h_ok and v_ok:
                if solve_runs_only(idx + 1):
                    return True
                    
            solution_grid[r][c] = 0
            
        return False
        
    solve_runs_only(0)
    
    # 4. Now calculate target sums for each run
    final_runs = []
    for run in runs:
        target_sum = sum(solution_grid[cr][cc] for cr, cc in run["cells"])
        final_runs.append({
            "target": target_sum,
            "cells": run["cells"]
        })
        
    # Return board template and final runs with clues
    # In Kakuro, the grid itself contains:
    # - Black cells: represented by -1
    # - White cells: represented by 0 (blank)
    kakuro_grid = [[-1 for _ in range(width)] for _ in range(height)]
    for r, c in white_cells:
        kakuro_grid[r][c] = 0
        
    return {
        "grid": kakuro_grid,
        "height": height,
        "width": width,
        "white_cells": white_cells,
        "runs": final_runs,
        "solution": solution_grid
    }
