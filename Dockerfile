FROM python:3.10-slim

# Install Node.js
RUN apt-get update && apt-get install -y nodejs npm

# Create virtual environment
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Upgrade pip
RUN pip install --upgrade pip

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy rest of code
COPY . .

CMD ["npm", "run", "dev"]
