#ifndef NQUEENS_HPP
#define NQUEENS_HPP

#include "../solvers/csp_solver.hpp"
#include <vector>
#include <cmath>

class NQueensDiagonalConstraint : public Constraint {
private:
    std::vector<int> variables;
public:
    NQueensDiagonalConstraint(const std::vector<int>& vars) : variables(vars) {}

    const std::vector<int>& get_variables() const override { return variables; }

    bool is_violated(const std::vector<int>& assignment, const std::vector<bool>& assigned) const override {
        int n = variables.size();
        for (int i = 0; i < n; ++i) {
            if (assigned[i]) {
                for (int j = i + 1; j < n; ++j) {
                    if (assigned[j]) {
                        int col1 = assignment[i];
                        int col2 = assignment[j];
                        if (std::abs(col1 - col2) == std::abs(i - j)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
};

inline CSPSolver* build_nqueens_csp(int n, bool use_mrv, bool use_degree, bool use_lcv, bool use_fc) {
    int num_vars = n;
    std::vector<std::vector<int>> domains(n);
    std::vector<std::pair<int, int>> var_coords(n);
    std::vector<Constraint*> constraints;

    for (int i = 0; i < n; ++i) {
        var_coords[i] = {i, -1}; // row i, col is the value
        domains[i].resize(n);
        for (int j = 0; j < n; ++j) {
            domains[i][j] = j; // Column positions 0 to n-1
        }
    }

    // 1. Column uniqueness: no two queens can be in the same column
    std::vector<int> all_vars(n);
    for (int i = 0; i < n; ++i) all_vars[i] = i;
    constraints.push_back(new AllDifferentConstraint(all_vars));

    // 2. Diagonal uniqueness
    constraints.push_back(new NQueensDiagonalConstraint(all_vars));

    CSPSolver* solver = new CSPSolver(num_vars, domains, constraints, var_coords);
    solver->configure(use_mrv, use_degree, use_lcv, use_fc);
    return solver;
}

#endif // NQUEENS_HPP
