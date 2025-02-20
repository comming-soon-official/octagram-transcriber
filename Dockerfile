FROM node:20-alpine
WORKDIR /app

COPY /server/package*.json ./
RUN npm install
COPY  /server/ .
RUN npm run build

EXPOSE 8000

CMD ["sh", "-c", "node dist/server.bundle.js"]
