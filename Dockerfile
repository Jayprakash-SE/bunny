# Base image for Python (Flask backend)
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies, including SQLite
RUN apt-get update && apt-get install -y \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy the backend code
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the Flask port
EXPOSE 5001

# Initialize SQLite database (optional if you want to pre-create tables)
RUN sqlite3 /app/test.db
RUN flask db migrate
RUN flask db upgrade

# Run the Flask backend
CMD ["python3", "app.py"]