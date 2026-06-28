#ifndef BACKTRACKING_SUDOKU_HPP
#define BACKTRACKING_SUDOKU_HPP

#include "base_solver.hpp"
#include <vector>

class BacktrackingSudoku : public BaseSolver {
private:
    std::vector<std::vector<int>> grid;

    bool is_valid(int r, int c, int val) {
        for (int i = 0; i < 9; ++i) {
            if (grid[r][i] == val) return false;
            if (grid[i][c] == val) return false;
        }
        int box_r = (r / 3) * 3;
        int box_c = (c / 3) * 3;
        for (int i = 0; i < 3; ++i) {
            for (int j = 0; j < 3; ++j) {
                if (grid[box_r + i][box_c + j] == val) return false;
            }
        }
        return true;
    }

    bool solve_dfs(int r, int c) {
        stats.nodes_visited++;
        if (r == 9) return true;
        if (c == 9) return solve_dfs(r + 1, 0);
        if (grid[r][c] != 0) return solve_dfs(r, c + 1);

        for (int val = 1; val <= 9; ++val) {
            if (is_valid(r, c, val)) {
                grid[r][c] = val;
                if (record_trace) {
                    trace.push_back({"try", r, c, val, {}});
                }

                if (solve_dfs(r, c + 1)) return true;

                grid[r][c] = 0;
                stats.backtracks++;
                if (record_trace) {
                    trace.push_back({"backtrack", r, c, val, {}});
                }
            }
        }
        return false;
    }

public:
    BacktrackingSudoku(const std::vector<std::vector<int>>& initial_grid) : grid(initial_grid) {}

    bool solve() override {
        start_timer();
        bool success = solve_dfs(0, 0);
        stop_timer();
        return success;
    }

    const std::vector<std::vector<int>>& get_solution() const {
        return grid;
    }
};

#endif // BACKTRACKING_SUDOKU_HPP
