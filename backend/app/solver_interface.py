import subprocess
import json
import os

# Resolve path to solver.exe
# Relative path from backend/app/solver_interface.py to cpp_engine/solver.exe
SOLVER_EXE = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "cpp_engine", "solver.exe"
))

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
