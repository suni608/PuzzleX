#ifndef KILLER_HPP
#define KILLER_HPP

#include "../solvers/csp_solver.hpp"
#include <vector>

struct KillerCage {
    int target;
    std::vector<std::pair<int, int>> cells;
};

inline CSPSolver* build_killer_csp(const std::vector<std::vector<int>>& grid,
                                  const std::vector<KillerCage>& cages,
                                  bool use_mrv, bool use_degree, bool use_lcv, bool use_fc)
{
    int num_vars = 81;
    std::vector<std::vector<int>> domains(num_vars);
    std::vector<std::pair<int, int>> var_coords(num_vars);
    std::vector<Constraint*> constraints;

    // 1. Domains & Coordinates
    for (int r = 0; r < 9; ++r) {
        for (int c = 0; c < 9; ++c) {
            int var_id = r * 9 + c;
            var_coords[var_id] = {r, c};
            if (grid[r][c] != 0) {
                domains[var_id] = {grid[r][c]};
            } else {
                domains[var_id] = {1, 2, 3, 4, 5, 6, 7, 8, 9};
            }
        }
    }

    // 2. Row Constraints
    for (int r = 0; r < 9; ++r) {
        std::vector<int> row_vars;
        for (int c = 0; c < 9; ++c) {
            row_vars.push_back(r * 9 + c);
        }
        constraints.push_back(new AllDifferentConstraint(row_vars));
    }

    // 3. Column Constraints
    for (int c = 0; c < 9; ++c) {
        std::vector<int> col_vars;
        for (int r = 0; r < 9; ++r) {
            col_vars.push_back(r * 9 + c);
        }
        constraints.push_back(new AllDifferentConstraint(col_vars));
    }

    // 4. Box Constraints
    for (int b = 0; b < 9; ++b) {
        std::vector<int> box_vars;
        int start_r = (b / 3) * 3;
        int start_c = (b % 3) * 3;
        for (int r = 0; r < 3; ++r) {
            for (int c = 0; c < 3; ++c) {
                box_vars.push_back((start_r + r) * 9 + (start_c + c));
            }
        }
        constraints.push_back(new AllDifferentConstraint(box_vars));
    }

    // 5. Cage Constraints
    for (const auto& cage : cages) {
        std::vector<int> cage_vars;
        for (const auto& p : cage.cells) {
            cage_vars.push_back(p.first * 9 + p.second);
        }
        constraints.push_back(new SumConstraint(cage_vars, cage.target, true));
    }

    CSPSolver* solver = new CSPSolver(num_vars, domains, constraints, var_coords);
    solver->configure(use_mrv, use_degree, use_lcv, use_fc);
    return solver;
}

#endif // KILLER_HPP
