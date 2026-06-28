# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Install system dependencies including g++ to compile our C++ solving core
RUN apt-get update && apt-get install -y \
    g++ \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set the working directory
WORKDIR /app

# Install Python requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy C++ source files and compile the engine
COPY ../cpp_engine /app/cpp_engine
WORKDIR /app/cpp_engine/src
RUN g++ -O3 -std=c++17 main.cpp -o ../solver

# Set working directory back to app root
WORKDIR /app

# Copy the rest of the backend files
COPY . /app/

# Expose port
EXPOSE 8000

# Run the FastAPI server
CMD uvicorn app.main:app --host 0.0.0.0 --port 8000
