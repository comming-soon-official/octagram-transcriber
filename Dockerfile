FROM node:20-alpine

# Install FFmpeg and additional dependencies
RUN apk add --no-cache ffmpeg ffmpeg-libs

WORKDIR /app

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

ARG DATABASE_URL
ARG OPENAI_KEY

ENV DATABASE_URL $DATABASE_URL
ENV OPENAI_KEY $OPENAI_KEY

# Copy and install dependencies
COPY /server/package*.json ./
RUN npm install

# Copy server files
COPY /server .
RUN npm run build

EXPOSE 8000

# Use a volume for uploads
VOLUME ["/app/uploads"]

CMD ["node", "dist/server.bundle.js"]