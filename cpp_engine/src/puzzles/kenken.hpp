#ifndef KENKEN_HPP
#define KENKEN_HPP

#include "../solvers/csp_solver.hpp"
#include <vector>

struct KenKenCage {
    int target;
    char op; // '+', '-', '*', '/', or ' ' for single cell
    std::vector<std::pair<int, int>> cells;
};

inline CSPSolver* build_kenken_csp(int size,
                                  const std::vector<KenKenCage>& cages,
                                  bool use_mrv, bool use_degree, bool use_lcv, bool use_fc)
{
    int num_vars = size * size;
    std::vector<std::vector<int>> domains(num_vars);
    std::vector<std::pair<int, int>> var_coords(num_vars);
    std::vector<Constraint*> constraints;

    // 1. Domains & Coordinates
    for (int r = 0; r < size; ++r) {
        for (int c = 0; c < size; ++c) {
            int var_id = r * size + c;
            var_coords[var_id] = {r, c};
            domains[var_id].resize(size);
            for (int i = 0; i < size; ++i) {
                domains[var_id][i] = i + 1; // 1 to size
            }
        }
    }

    // 2. Row Constraints
    for (int r = 0; r < size; ++r) {
        std::vector<int> row_vars;
        for (int c = 0; c < size; ++c) {
            row_vars.push_back(r * size + c);
        }
        constraints.push_back(new AllDifferentConstraint(row_vars));
    }

    // 3. Column Constraints
    for (int c = 0; c < size; ++c) {
        std::vector<int> col_vars;
        for (int r = 0; r < size; ++r) {
            col_vars.push_back(r * size + c);
        }
        constraints.push_back(new AllDifferentConstraint(col_vars));
    }

    // 4. Cage Constraints
    for (const auto& cage : cages) {
        std::vector<int> cage_vars;
        for (const auto& p : cage.cells) {
            cage_vars.push_back(p.first * size + p.second);
        }

        if (cage.cells.size() == 1) {
            // Single cell cage: restrict domain directly to the target value
            int var_id = cage.cells[0].first * size + cage.cells[0].second;
            domains[var_id] = {cage.target};
        } else {
            // KenKen cages don't enforce uniqueness inside the cage itself.
            // So we use KenKenOperatorConstraint or SumConstraint(unique=false).
            if (cage.op == '+') {
                constraints.push_back(new SumConstraint(cage_vars, cage.target, false));
            } else {
                constraints.push_back(new KenKenOperatorConstraint(cage_vars, cage.op, cage.target));
            }
        }
    }

    CSPSolver* solver = new CSPSolver(num_vars, domains, constraints, var_coords);
    solver->configure(use_mrv, use_degree, use_lcv, use_fc);
    return solver;
}

#endif // KENKEN_HPP
