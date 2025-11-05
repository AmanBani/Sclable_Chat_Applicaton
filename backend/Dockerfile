# backend/Dockerfile
FROM python:3.12-slim

# system deps needed to build some Python packages (psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first to use Docker cache
COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Recommended for production: use gunicorn (uncomment the line below in prod)
# CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "-w", "4", "-b", "0.0.0.0:8000"]

# For development and simple deployment we use uvicorn (hot reload not used in deployed image)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
