#include "json.hpp"
#include "solvers/base_solver.hpp"
#include "solvers/backtracking_sudoku.hpp"
#include "solvers/csp_solver.hpp"
#include "solvers/dlx_solver.hpp"
#include "puzzles/sudoku.hpp"
#include "puzzles/killer.hpp"
#include "puzzles/kakuro.hpp"
#include "puzzles/kenken.hpp"
#include "puzzles/nqueens.hpp"

#include <iostream>
#include <string>
#include <vector>

using json = nlohmann::json;

int main() {
    // Set standard input/output streams to be fast
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::string input_str;
    std::string line;
    while (std::getline(std::cin, line)) {
        input_str += line + "\n";
    }

    json output_json;

    try {
        json input_json = json::parse(input_str);

        std::string puzzle_type = input_json.value("puzzle_type", "sudoku");
        std::string algorithm = input_json.value("algorithm", "csp");
        bool record_trace = input_json.value("record_trace", false);

        bool use_mrv = false;
        bool use_degree = false;
        bool use_lcv = false;
        bool use_fc = false;

        if (input_json.contains("params")) {
            auto params = input_json["params"];
            use_mrv = params.value("use_mrv", false);
            use_degree = params.value("use_degree", false);
            use_lcv = params.value("use_lcv", false);
            use_fc = params.value("use_fc", false);
        }

        bool solved = false;
        SolverStats stats;
        std::vector<TraceStep> trace;
        json solution_data;

        if (puzzle_type == "sudoku") {
            auto grid = input_json["sudoku"]["grid"].get<std::vector<std::vector<int>>>();

            if (algorithm == "backtracking") {
                BacktrackingSudoku solver(grid);
                solver.set_record_trace(record_trace);
                solved = solver.solve();
                stats = solver.get_stats();
                trace = solver.get_trace();
                solution_data = solver.get_solution();
            } 
            else if (algorithm == "dlx") {
                DLXSudoku solver(grid);
                solver.set_record_trace(record_trace);
                if (input_json.value("check_uniqueness", false)) {
                    int sol_count = 0;
                    solved = solver.solve_uniqueness(sol_count);
                    output_json["solution_count"] = sol_count;
                    output_json["unique"] = (sol_count == 1);
                } else {
                    solved = solver.solve();
                }
                stats = solver.get_stats();
                trace = solver.get_trace();
                solution_data = solver.get_solution();
            } 
            else { // csp
                CSPSolver* solver = build_sudoku_csp(grid, use_mrv, use_degree, use_lcv, use_fc);
                solver->set_record_trace(record_trace);
                solved = solver->solve();
                stats = solver->get_stats();
                trace = solver->get_trace();
                
                auto flat_sol = solver->get_solution();
                std::vector<std::vector<int>> sol_grid(9, std::vector<int>(9, 0));
                for (int r = 0; r < 9; ++r) {
                    for (int c = 0; c < 9; ++c) {
                        sol_grid[r][c] = flat_sol[r * 9 + c];
                    }
                }
                solution_data = sol_grid;
                delete solver;
            }
        } 
        else if (puzzle_type == "killer") {
            auto grid = input_json["killer"]["grid"].get<std::vector<std::vector<int>>>();
            auto json_cages = input_json["killer"]["cages"];
            std::vector<KillerCage> cages;
            for (const auto& jc : json_cages) {
                KillerCage cage;
                cage.target = jc["target"];
                auto json_cells = jc["cells"].get<std::vector<std::vector<int>>>();
                for (const auto& cell : json_cells) {
                    cage.cells.push_back({cell[0], cell[1]});
                }
                cages.push_back(cage);
            }

            CSPSolver* solver = build_killer_csp(grid, cages, use_mrv, use_degree, use_lcv, use_fc);
            solver->set_record_trace(record_trace);
            solved = solver->solve();
            stats = solver->get_stats();
            trace = solver->get_trace();

            auto flat_sol = solver->get_solution();
            std::vector<std::vector<int>> sol_grid(9, std::vector<int>(9, 0));
            for (int r = 0; r < 9; ++r) {
                for (int c = 0; c < 9; ++c) {
                    sol_grid[r][c] = flat_sol[r * 9 + c];
                }
            }
            solution_data = sol_grid;
            delete solver;
        } 
        else if (puzzle_type == "kakuro") {
            int height = input_json["kakuro"]["height"];
            int width = input_json["kakuro"]["width"];
            auto json_whites = input_json["kakuro"]["white_cells"].get<std::vector<std::vector<int>>>();
            std::vector<std::pair<int, int>> white_cells;
            for (const auto& w : json_whites) {
                white_cells.push_back({w[0], w[1]});
            }

            auto json_runs = input_json["kakuro"]["runs"];
            std::vector<KakuroRun> runs;
            for (const auto& jr : json_runs) {
                KakuroRun run;
                run.target = jr["target"];
                auto json_cells = jr["cells"].get<std::vector<std::vector<int>>>();
                for (const auto& cell : json_cells) {
                    run.cells.push_back({cell[0], cell[1]});
                }
                runs.push_back(run);
            }

            CSPSolver* solver = build_kakuro_csp(height, width, white_cells, runs, use_mrv, use_degree, use_lcv, use_fc);
            solver->set_record_trace(record_trace);
            solved = solver->solve();
            stats = solver->get_stats();
            trace = solver->get_trace();

            auto flat_sol = solver->get_solution();
            std::vector<std::vector<int>> sol_grid(height, std::vector<int>(width, 0));
            for (size_t i = 0; i < white_cells.size(); ++i) {
                int r = white_cells[i].first;
                int c = white_cells[i].second;
                sol_grid[r][c] = flat_sol[i];
            }
            solution_data = sol_grid;
            delete solver;
        } 
        else if (puzzle_type == "kenken") {
            int size = input_json["kenken"]["size"];
            auto json_cages = input_json["kenken"]["cages"];
            std::vector<KenKenCage> cages;
            for (const auto& jc : json_cages) {
                KenKenCage cage;
                cage.target = jc["target"];
                std::string op_str = jc.value("op", " ");
                cage.op = op_str.empty() ? ' ' : op_str[0];
                auto json_cells = jc["cells"].get<std::vector<std::vector<int>>>();
                for (const auto& cell : json_cells) {
                    cage.cells.push_back({cell[0], cell[1]});
                }
                cages.push_back(cage);
            }

            CSPSolver* solver = build_kenken_csp(size, cages, use_mrv, use_degree, use_lcv, use_fc);
            solver->set_record_trace(record_trace);
            solved = solver->solve();
            stats = solver->get_stats();
            trace = solver->get_trace();

            auto flat_sol = solver->get_solution();
            std::vector<std::vector<int>> sol_grid(size, std::vector<int>(size, 0));
            for (int r = 0; r < size; ++r) {
                for (int c = 0; c < size; ++c) {
                    sol_grid[r][c] = flat_sol[r * size + c];
                }
            }
            solution_data = sol_grid;
            delete solver;
        } 
        else if (puzzle_type == "nqueens") {
            int n = input_json["nqueens"]["n"].get<int>();

            CSPSolver* solver = build_nqueens_csp(n, use_mrv, use_degree, use_lcv, use_fc);
            solver->set_record_trace(record_trace);
            solved = solver->solve();
            stats = solver->get_stats();
            trace = solver->get_trace();

            auto flat_sol = solver->get_solution(); // Column indices for rows 0 to n-1
            solution_data = flat_sol;
            delete solver;
        } 
        else {
            throw std::runtime_error("Unknown puzzle type: " + puzzle_type);
        }

        // Format output JSON
        output_json["solved"] = solved;
        output_json["solution"] = solution_data;
        output_json["stats"] = {
            {"time_ms", stats.time_ms},
            {"nodes_visited", stats.nodes_visited},
            {"backtracks", stats.backtracks}
        };

        json trace_json = json::array();
        if (record_trace) {
            for (const auto& step : trace) {
                json step_json = {
                    {"type", step.type},
                    {"row", step.row},
                    {"col", step.col},
                    {"val", step.val}
                };
                if (!step.domain.empty()) {
                    step_json["domain"] = step.domain;
                }
                trace_json.push_back(step_json);
            }
        }
        output_json["trace"] = trace_json;

    } catch (const std::exception& e) {
        output_json["solved"] = false;
        output_json["error"] = e.what();
    }

    std::cout << output_json.dump() << std::endl;
    return 0;
}
