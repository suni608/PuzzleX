#ifndef CSP_SOLVER_HPP
#define CSP_SOLVER_HPP

#include "base_solver.hpp"
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <algorithm>
#include <cmath>
#include <iostream>

class Constraint {
public:
    virtual ~Constraint() = default;
    virtual const std::vector<int>& get_variables() const = 0;
    virtual bool is_violated(const std::vector<int>& assignment, const std::vector<bool>& assigned) const = 0;
};

// AllDifferent Constraint
class AllDifferentConstraint : public Constraint {
private:
    std::vector<int> variables;
public:
    AllDifferentConstraint(const std::vector<int>& vars) : variables(vars) {}
    
    const std::vector<int>& get_variables() const override { return variables; }
    
    bool is_violated(const std::vector<int>& assignment, const std::vector<bool>& assigned) const override {
        std::vector<bool> seen(100, false); // Values are typically 1-9 or 1-N (N<=9)
        for (int var : variables) {
            if (assigned[var]) {
                int val = assignment[var];
                if (val >= 0 && val < 100) {
                    if (seen[val]) return true;
                    seen[val] = true;
                }
            }
        }
        return false;
    }
};

// Sum Constraint (for Killer Sudoku and Kakuro cages)
class SumConstraint : public Constraint {
private:
    std::vector<int> variables;
    int target_sum;
    bool must_be_unique;
public:
    SumConstraint(const std::vector<int>& vars, int sum, bool unique = true) 
        : variables(vars), target_sum(sum), must_be_unique(unique) {}

    const std::vector<int>& get_variables() const override { return variables; }

    bool is_violated(const std::vector<int>& assignment, const std::vector<bool>& assigned) const override {
        int current_sum = 0;
        int unassigned_count = 0;
        std::vector<bool> seen(100, false);
        
        for (int var : variables) {
            if (assigned[var]) {
                int val = assignment[var];
                if (must_be_unique) {
                    if (seen[val]) return true;
                    seen[val] = true;
                }
                current_sum += val;
            } else {
                unassigned_count++;
            }
        }
        
        if (unassigned_count == 0) {
            return current_sum != target_sum;
        }
        
        // Partially assigned: the current sum must not exceed target sum
        // and must leave room for the remaining unassigned variables.
        // Assuming minimum possible value is 1, minimum remaining sum is unassigned_count * 1
        if (current_sum + unassigned_count > target_sum) {
            return true;
        }
        // Maximum possible value is 9 (or similar), maximum remaining sum is unassigned_count * 9
        // If current_sum + unassigned_count * 9 < target_sum, it's impossible to reach target sum
        if (current_sum + unassigned_count * 9 < target_sum) {
            return true;
        }
        
        return false;
    }
};

// KenKen Custom Cage Operator Constraint
class KenKenOperatorConstraint : public Constraint {
private:
    std::vector<int> variables;
    char op;
    int target;
public:
    KenKenOperatorConstraint(const std::vector<int>& vars, char operation, int target_val)
        : variables(vars), op(operation), target(target_val) {}

    const std::vector<int>& get_variables() const override { return variables; }

    bool is_violated(const std::vector<int>& assignment, const std::vector<bool>& assigned) const override {
        int unassigned_count = 0;
        std::vector<int> vals;
        for (int var : variables) {
            if (assigned[var]) {
                vals.push_back(assignment[var]);
            } else {
                unassigned_count++;
            }
        }

        if (unassigned_count > 0) {
            // Partial validation for additions/multiplications to fail early
            if (op == '+') {
                int current_sum = 0;
                for (int v : vals) current_sum += v;
                if (current_sum + unassigned_count > target) return true;
            } else if (op == '*') {
                int current_prod = 1;
                for (int v : vals) current_prod *= v;
                if (current_prod > target) return true;
                if (target % current_prod != 0) return true; // Product must divide target
            }
            return false; // Can't fully violate subtraction/division until all assigned
        }

        // Fully assigned validation
        if (op == '+') {
            int sum = 0;
            for (int v : vals) sum += v;
            return sum != target;
        } else if (op == '*') {
            int prod = 1;
            for (int v : vals) prod *= v;
            return prod != target;
        } else if (op == '-') {
            if (vals.size() != 2) return true;
            return std::abs(vals[0] - vals[1]) != target;
        } else if (op == '/') {
            if (vals.size() != 2) return true;
            double q1 = (double)vals[0] / vals[1];
            double q2 = (double)vals[1] / vals[0];
            return std::abs(q1 - target) > 1e-9 && std::abs(q2 - target) > 1e-9;
        }
        return true;
    }
};

class CSPSolver : public BaseSolver {
private:
    int num_variables;
    std::vector<std::vector<int>> domains;
    std::vector<Constraint*> constraints;
    std::vector<int> assignment;
    std::vector<bool> assigned;
    std::vector<std::pair<int, int>> var_coords; // Maps variable index to (row, col)

    // Optimization flags
    bool use_mrv = false;
    bool use_degree = false;
    bool use_lcv = false;
    bool use_forward_checking = false;

    // Fast mapping from variable index to constraints involving it
    std::vector<std::vector<Constraint*>> var_to_constraints;

    int get_degree(int var) {
        std::unordered_set<int> unassigned_neighbors;
        for (Constraint* c : var_to_constraints[var]) {
            for (int u : c->get_variables()) {
                if (u != var && !assigned[u]) {
                    unassigned_neighbors.insert(u);
                }
            }
        }
        return unassigned_neighbors.size();
    }

    int select_unassigned_variable() {
        int best_var = -1;
        size_t min_domain_size = 999999;
        int max_degree = -1;

        for (int i = 0; i < num_variables; ++i) {
            if (!assigned[i]) {
                size_t dom_size = domains[i].size();
                if (use_mrv) {
                    if (dom_size < min_domain_size) {
                        min_domain_size = dom_size;
                        best_var = i;
                        if (use_degree) {
                            max_degree = get_degree(i);
                        }
                    } else if (dom_size == min_domain_size && use_degree) {
                        int deg = get_degree(i);
                        if (deg > max_degree) {
                            max_degree = deg;
                            best_var = i;
                        }
                    }
                } else {
                    if (use_degree) {
                        int deg = get_degree(i);
                        if (deg > max_degree) {
                            max_degree = deg;
                            best_var = i;
                        }
                    } else {
                        return i; // First unassigned
                    }
                }
            }
        }
        if (best_var != -1) return best_var;
        for (int i = 0; i < num_variables; ++i) {
            if (!assigned[i]) return i;
        }
        return -1;
    }

    std::vector<int> order_domain_values(int var) {
        const auto& domain = domains[var];
        if (!use_lcv) return domain;

        std::vector<std::pair<int, int>> val_conflicts; // {value, conflict_count}
        for (int val : domain) {
            int conflicts = 0;
            // Temporary assignment
            assignment[var] = val;
            assigned[var] = true;

            for (Constraint* c : var_to_constraints[var]) {
                for (int u : c->get_variables()) {
                    if (!assigned[u]) {
                        for (int u_val : domains[u]) {
                            assignment[u] = u_val;
                            assigned[u] = true;
                            if (c->is_violated(assignment, assigned)) {
                                conflicts++;
                            }
                            assignment[u] = -1;
                            assigned[u] = false;
                        }
                    }
                }
            }

            // Undo temp assignment
            assignment[var] = -1;
            assigned[var] = false;

            val_conflicts.push_back({val, conflicts});
        }

        std::sort(val_conflicts.begin(), val_conflicts.end(), 
                 [](const std::pair<int, int>& a, const std::pair<int, int>& b) {
                     return a.second < b.second;
                 });

        std::vector<int> ordered_domain;
        for (const auto& p : val_conflicts) {
            ordered_domain.push_back(p.first);
        }
        return ordered_domain;
    }

    bool check_consistency(int var) {
        for (Constraint* c : var_to_constraints[var]) {
            if (c->is_violated(assignment, assigned)) {
                return false;
            }
        }
        return true;
    }

    bool forward_checking(int var, int val, std::vector<std::pair<int, int>>& pruned) {
        for (Constraint* c : var_to_constraints[var]) {
            for (int u : c->get_variables()) {
                if (!assigned[u]) {
                    auto& domain = domains[u];
                    for (auto it = domain.begin(); it != domain.end(); ) {
                        int d_val = *it;
                        // Temp assignment
                        assignment[u] = d_val;
                        assigned[u] = true;
                        
                        bool violated = c->is_violated(assignment, assigned);
                        
                        assignment[u] = -1;
                        assigned[u] = false;
                        
                        if (violated) {
                            pruned.push_back({u, d_val});
                            it = domain.erase(it);
                            if (record_trace) {
                                trace.push_back({"prune", var_coords[u].first, var_coords[u].second, d_val, domain});
                            }
                        } else {
                            ++it;
                        }
                    }
                    if (domain.empty()) {
                        return false; // Domain wipeout!
                    }
                }
            }
        }
        return true;
    }

    bool backtrack_search() {
        stats.nodes_visited++;
        int var = select_unassigned_variable();
        if (var == -1) return true; // All variables assigned successfully!

        int r = var_coords[var].first;
        int c = var_coords[var].second;

        std::vector<int> ordered_vals = order_domain_values(var);
        for (int val : ordered_vals) {
            assignment[var] = val;
            assigned[var] = true;

            if (record_trace) {
                trace.push_back({"try", r, c, val, domains[var]});
            }

            if (check_consistency(var)) {
                std::vector<std::pair<int, int>> pruned;
                bool fc_ok = true;

                if (use_forward_checking) {
                    fc_ok = forward_checking(var, val, pruned);
                }

                if (fc_ok) {
                    if (backtrack_search()) return true;
                }

                // Restore forward checking prunings
                if (use_forward_checking && !pruned.empty()) {
                    // Restore in reverse order
                    for (auto it = pruned.rbegin(); it != pruned.rend(); ++it) {
                        int u = it->first;
                        int d_val = it->second;
                        domains[u].push_back(d_val);
                        // Sort domain back to original ascending order
                        std::sort(domains[u].begin(), domains[u].end());
                        if (record_trace) {
                            trace.push_back({"unprune", var_coords[u].first, var_coords[u].second, d_val, domains[u]});
                        }
                    }
                }
            }

            // Undo assignment
            assignment[var] = -1;
            assigned[var] = false;
            stats.backtracks++;

            if (record_trace) {
                trace.push_back({"backtrack", r, c, val, domains[var]});
            }
        }

        return false;
    }

public:
    CSPSolver(int num_vars,
              const std::vector<std::vector<int>>& initial_domains,
              const std::vector<Constraint*>& initial_constraints,
              const std::vector<std::pair<int, int>>& initial_var_coords)
        : num_variables(num_vars), 
          domains(initial_domains), 
          constraints(initial_constraints),
          var_coords(initial_var_coords) 
    {
        assignment.assign(num_variables, -1);
        assigned.assign(num_variables, false);
        
        // Setup initial pre-assignments
        for (int i = 0; i < num_variables; ++i) {
            if (domains[i].size() == 1) {
                assignment[i] = domains[i][0];
                assigned[i] = true;
            }
        }

        // Map variables to constraints
        var_to_constraints.resize(num_variables);
        for (Constraint* c : constraints) {
            for (int var : c->get_variables()) {
                var_to_constraints[var].push_back(c);
            }
        }
    }

    ~CSPSolver() override {
        // We delete constraints passed to us
        for (Constraint* c : constraints) {
            delete c;
        }
    }

    void configure(bool mrv, bool degree, bool lcv, bool fc) {
        use_mrv = mrv;
        use_degree = degree;
        use_lcv = lcv;
        use_forward_checking = fc;
    }

    bool solve() override {
        start_timer();
        bool success = backtrack_search();
        stop_timer();
        return success;
    }

    const std::vector<int>& get_solution() const {
        return assignment;
    }
};

#endif // CSP_SOLVER_HPP
