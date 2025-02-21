FROM node:20-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app


ARG DATABASE_URL
ARG OPENAI_KEY

ENV DATABASE_URL $DATABASE_URL
ENV OPENAI_KEY $OPENAI_KEY

COPY /server/package*.json ./
RUN npm install
COPY  /server .
RUN npm run build


EXPOSE 8000


CMD ["sh", "-c", "node dist/server.bundle.js"]
