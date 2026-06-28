from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from .db import Base

class Puzzle(Base):
    __tablename__ = "puzzles"

    id = Column(Integer, primary_key=True, index=True)
    puzzle_type = Column(String(50), nullable=False) # sudoku, killer, kakuro, kenken
    difficulty = Column(String(50), nullable=False)  # easy, medium, hard, expert
    board_data = Column(Text, nullable=False)         # JSON string of layout/cages
    solution_data = Column(Text, nullable=True)      # JSON string of solved layout
    created_at = Column(DateTime, default=datetime.utcnow)

class BenchmarkHistory(Base):
    __tablename__ = "benchmark_history"

    id = Column(Integer, primary_key=True, index=True)
    puzzle_type = Column(String(50), nullable=False)
    difficulty = Column(String(50), nullable=False)
    algorithm = Column(String(50), nullable=False)
    time_ms = Column(Float, nullable=False)
    nodes_visited = Column(Integer, nullable=False)
    backtracks = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
