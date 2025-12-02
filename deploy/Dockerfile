FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production || npm ci
COPY . .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npx","tsx","src/server/index.ts"]
