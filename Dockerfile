FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Cloud Run expects port from PORT env variable
ENV PORT=8080
EXPOSE 8080

# Start the Node.js server
CMD ["node", "server.js"]
