#ifndef BASE_SOLVER_HPP
#define BASE_SOLVER_HPP

#include <string>
#include <vector>
#include <chrono>

struct TraceStep {
    std::string type;       // "try", "backtrack", "prune", "unprune"
    int row;
    int col;
    int val;
    std::vector<int> domain; // Remaining values in domain (optional, for CSP visualization)
};

struct SolverStats {
    double time_ms = 0.0;
    long long nodes_visited = 0;
    long long backtracks = 0;
};

class BaseSolver {
protected:
    SolverStats stats;
    std::vector<TraceStep> trace;
    bool record_trace = false;

    void start_timer() {
        start_time = std::chrono::high_resolution_clock::now();
    }

    void stop_timer() {
        auto end_time = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> duration = end_time - start_time;
        stats.time_ms = duration.count();
    }

private:
    std::chrono::high_resolution_clock::time_point start_time;

public:
    virtual ~BaseSolver() = default;
    virtual bool solve() = 0;
    
    void set_record_trace(bool record) { record_trace = record; }
    const SolverStats& get_stats() const { return stats; }
    const std::vector<TraceStep>& get_trace() const { return trace; }
};

#endif // BASE_SOLVER_HPP
