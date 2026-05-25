# Use official Puppeteer Node image containing pre-installed Chrome and OS libraries
FROM ghcr.io/puppeteer/puppeteer:23.6.0

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Compile TypeScript
RUN npm run build

# Render sets the PORT dynamically, we default to 5000
EXPOSE 5000

# Start server
CMD ["node", "dist/server.js"]
