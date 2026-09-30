# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 4000 to the container network
EXPOSE 4000

# Command to start the gateway
CMD ["npm", "start"]