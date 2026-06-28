#ifndef DLX_SOLVER_HPP
#define DLX_SOLVER_HPP

#include "base_solver.hpp"
#include <vector>
#include <iostream>
#include <algorithm>

class DLXSudoku : public BaseSolver {
private:
    struct DLXNode {
        DLXNode* left = nullptr;
        DLXNode* right = nullptr;
        DLXNode* up = nullptr;
        DLXNode* down = nullptr;
        DLXNode* col_header = nullptr;
        int row_id = -1; // 0 to 728
        int col_id = -1; // 0 to 323
        int node_count = 0; // Used for column headers
    };

    DLXNode* root = nullptr;
    std::vector<DLXNode*> col_headers;
    std::vector<DLXNode*> row_nodes; // Keeps track of nodes created to clean them up
    std::vector<int> solution_rows;
    std::vector<std::vector<int>> initial_grid;
    std::vector<std::vector<int>> final_grid;

    // Map choice_id to (r, c, v)
    void parse_choice(int choice_id, int& r, int& c, int& v) {
        v = (choice_id % 9) + 1;
        c = (choice_id / 9) % 9;
        r = choice_id / 81;
    }

    void cover(DLXNode* col) {
        col->right->left = col->left;
        col->left->right = col->right;

        for (DLXNode* row = col->down; row != col; row = row->down) {
            for (DLXNode* node = row->right; node != row; node = node->right) {
                node->down->up = node->up;
                node->up->down = node->down;
                node->col_header->node_count--;
            }
        }
    }

    void uncover(DLXNode* col) {
        for (DLXNode* row = col->up; row != col; row = row->up) {
            for (DLXNode* node = row->left; node != row; node = node->left) {
                node->col_header->node_count++;
                node->down->up = node;
                node->up->down = node;
            }
        }
        col->right->left = col;
        col->left->right = col;
    }

    DLXNode* select_column() {
        DLXNode* min_col = nullptr;
        int min_count = 999999;
        for (DLXNode* col = root->right; col != root; col = col->right) {
            if (col->node_count < min_count) {
                min_count = col->node_count;
                min_col = col;
            }
        }
        return min_col;
    }

    bool search() {
        stats.nodes_visited++;
        if (root->right == root) {
            // Found exact cover solution! Populate final_grid.
            final_grid = initial_grid;
            for (int row_id : solution_rows) {
                int r, c, v;
                parse_choice(row_id, r, c, v);
                final_grid[r][c] = v;
            }
            return true;
        }

        DLXNode* col = select_column();
        if (!col || col->node_count == 0) return false;

        cover(col);

        for (DLXNode* row = col->down; row != col; row = row->down) {
            solution_rows.push_back(row->row_id);
            int r, c, v;
            parse_choice(row->row_id, r, c, v);

            if (record_trace) {
                trace.push_back({"try", r, c, v, {}});
            }

            for (DLXNode* node = row->right; node != row; node = node->right) {
                cover(node->col_header);
            }

            if (search()) return true;

            // Backtrack
            for (DLXNode* node = row->left; node != row; node = node->left) {
                uncover(node->col_header);
            }

            solution_rows.pop_back();
            stats.backtracks++;
            if (record_trace) {
                trace.push_back({"backtrack", r, c, v, {}});
            }
        }

        uncover(col);
        return false;
    }

    int solution_count = 0;

    void search_all(int limit) {
        stats.nodes_visited++;
        if (solution_count >= limit) return;
        if (root->right == root) {
            solution_count++;
            if (solution_count == 1) {
                final_grid = initial_grid;
                for (int row_id : solution_rows) {
                    int r, c, v;
                    parse_choice(row_id, r, c, v);
                    final_grid[r][c] = v;
                }
            }
            return;
        }

        DLXNode* col = select_column();
        if (!col || col->node_count == 0) return;

        cover(col);

        for (DLXNode* row = col->down; row != col; row = row->down) {
            solution_rows.push_back(row->row_id);
            for (DLXNode* node = row->right; node != row; node = node->right) {
                cover(node->col_header);
            }

            search_all(limit);
            if (solution_count >= limit) return;

            for (DLXNode* node = row->left; node != row; node = node->left) {
                uncover(node->col_header);
            }
            solution_rows.pop_back();
            stats.backtracks++;
        }

        uncover(col);
    }

    void build_sparse_matrix() {
        root = new DLXNode();
        root->left = root;
        root->right = root;

        col_headers.resize(324);
        DLXNode* prev_header = root;
        for (int i = 0; i < 324; ++i) {
            DLXNode* h = new DLXNode();
            h->col_id = i;
            h->up = h;
            h->down = h;
            h->left = prev_header;
            h->right = root;
            prev_header->right = h;
            root->left = h;
            col_headers[i] = h;
            prev_header = h;
        }

        // Generate 729 choices
        for (int r = 0; r < 9; ++r) {
            for (int c = 0; c < 9; ++c) {
                // If cell is pre-filled, we only add the choice matching that value
                int init_val = initial_grid[r][c];
                int start_v = (init_val == 0) ? 1 : init_val;
                int end_v = (init_val == 0) ? 9 : init_val;

                for (int v = start_v; v <= end_v; ++v) {
                    int choice_id = r * 81 + c * 9 + (v - 1);
                    int box = (r / 3) * 3 + (c / 3);

                    int cols[4] = {
                        r * 9 + c,                     // cell constraint
                        81 + r * 9 + (v - 1),          // row constraint
                        162 + c * 9 + (v - 1),         // col constraint
                        243 + box * 9 + (v - 1)        // box constraint
                    };

                    DLXNode* first_in_row = nullptr;
                    DLXNode* prev_node = nullptr;

                    for (int col_idx : cols) {
                        DLXNode* h = col_headers[col_idx];
                        DLXNode* node = new DLXNode();
                        node->row_id = choice_id;
                        node->col_id = col_idx;
                        node->col_header = h;

                        // Insert vertically at bottom of column
                        node->up = h->up;
                        node->down = h;
                        h->up->down = node;
                        h->up = node;
                        h->node_count++;

                        // Insert horizontally in row
                        if (!first_in_row) {
                            first_in_row = node;
                            node->left = node;
                            node->right = node;
                        } else {
                            node->left = prev_node;
                            node->right = first_in_row;
                            prev_node->right = node;
                            first_in_row->left = node;
                        }
                        prev_node = node;
                        row_nodes.push_back(node);
                    }
                }
            }
        }
    }

    void cleanup() {
        for (DLXNode* node : row_nodes) {
            delete node;
        }
        for (DLXNode* h : col_headers) {
            delete h;
        }
        delete root;
    }

public:
    DLXSudoku(const std::vector<std::vector<int>>& grid) : initial_grid(grid) {}

    ~DLXSudoku() override {
        cleanup();
    }

    bool solve() override {
        start_timer();
        build_sparse_matrix();
        
        // Pre-cover columns for clues
        // Our construction already handles clues by only creating the node rows for the clue values.
        // So we can directly run standard search.
        bool success = search();
        stop_timer();
        return success;
    }

    bool solve_uniqueness(int& out_solution_count) {
        start_timer();
        build_sparse_matrix();
        solution_count = 0;
        search_all(2);
        out_solution_count = solution_count;
        stop_timer();
        return solution_count == 1;
    }

    const std::vector<std::vector<int>>& get_solution() const {
        return final_grid;
    }
};

#endif // DLX_SOLVER_HPP
