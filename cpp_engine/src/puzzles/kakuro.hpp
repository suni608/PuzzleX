#ifndef KAKURO_HPP
#define KAKURO_HPP

#include "../solvers/csp_solver.hpp"
#include <vector>
#include <map>

struct KakuroRun {
    int target;
    std::vector<std::pair<int, int>> cells;
};

inline CSPSolver* build_kakuro_csp(int height, int width,
                                  const std::vector<std::pair<int, int>>& white_cells,
                                  const std::vector<KakuroRun>& runs,
                                  bool use_mrv, bool use_degree, bool use_lcv, bool use_fc)
{
    int num_vars = white_cells.size();
    std::vector<std::vector<int>> domains(num_vars, std::vector<int>{1, 2, 3, 4, 5, 6, 7, 8, 9});
    std::vector<std::pair<int, int>> var_coords(num_vars);
    std::vector<Constraint*> constraints;

    // Map cell coordinate to variable index
    std::map<std::pair<int, int>, int> cell_to_var;
    for (int i = 0; i < num_vars; ++i) {
        cell_to_var[white_cells[i]] = i;
        var_coords[i] = white_cells[i];
    }

    // Runs are mapped to SumConstraints
    for (const auto& run : runs) {
        std::vector<int> run_vars;
        for (const auto& cell : run.cells) {
            auto it = cell_to_var.find(cell);
            if (it != cell_to_var.end()) {
                run_vars.push_back(it->second);
            }
        }
        if (!run_vars.empty()) {
            constraints.push_back(new SumConstraint(run_vars, run.target, true));
        }
    }

    CSPSolver* solver = new CSPSolver(num_vars, domains, constraints, var_coords);
    solver->configure(use_mrv, use_degree, use_lcv, use_fc);
    return solver;
}

#endif // KAKURO_HPP
