# Stage 1: Build the Next.js frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production image with Python + Node
FROM python:3.10-slim

# Install system dependencies + Node.js
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    g++ \
    gcc \
    python3-dev \
    libgl1 \
    libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Debug (optional)
RUN python3 --version && node -v && npm -v

# Copy built Next.js app + Python backend
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/package.json ./package.json
COPY --from=frontend-builder /app/next.config.ts ./next.config.ts
COPY --from=frontend-builder /app/public ./public

# Copy Python scripts and face_match module
COPY compare_api.py search_api.py ./
COPY face_match ./face_match

# Important for InsightFace (avoids runtime crash)
RUN mkdir -p /root/.insightface

# Use dynamic port (Render requirement)
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start"]
