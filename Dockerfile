FROM oven/bun:alpine

COPY package.json ./
COPY bun.lockb ./
COPY src/ ./

RUN bun install --production

ENV GITHUB_API_TOKEN=""
ENV LASTFM_API_TOKEN=""

CMD ["bun", "run", "./main.ts"]
