import subprocess
import json
import os

# Resolve path to solver binary
SOLVER_EXE = os.getenv("SOLVER_PATH")

if not SOLVER_EXE:
    # Auto-detect binary name based on operating system and environment (local vs Docker)
    base_dir_local = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "cpp_engine"))
    base_dir_docker = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "cpp_engine"))
    
    # Check both paths to see if solver or solver.exe is present
    for base_dir in [base_dir_docker, base_dir_local]:
        exe_path = os.path.join(base_dir, "solver.exe")
        bin_path = os.path.join(base_dir, "solver")
        
        if os.path.exists(bin_path):
            SOLVER_EXE = bin_path
            break
        elif os.path.exists(exe_path):
            SOLVER_EXE = exe_path
            break
    else:
        # Default fallback if nothing exists yet
        SOLVER_EXE = os.path.join(base_dir_local, "solver.exe")

def run_cpp_solver(payload: dict) -> dict:
    """
    Spawns solver.exe, passes the JSON payload via stdin,
    and returns the parsed JSON output from stdout.
    """
    if not os.path.exists(SOLVER_EXE):
        return {
            "solved": False,
            "error": f"C++ solver binary not found at {SOLVER_EXE}. Please compile it first."
        }
        
    try:
        proc = subprocess.Popen(
            [SOLVER_EXE],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = proc.communicate(input=json.dumps(payload))
        
        if proc.returncode != 0:
            return {
                "solved": False,
                "error": f"C++ solver crashed with code {proc.returncode}. Stderr: {stderr}"
            }
            
        try:
            return json.loads(stdout)
        except json.JSONDecodeError:
            return {
                "solved": False,
                "error": f"Failed to parse solver output as JSON. Output: {stdout}"
            }
            
    except Exception as e:
        return {
            "solved": False,
            "error": f"Failed to execute C++ solver subprocess: {str(e)}"
        }
