FROM mcr.microsoft.com/playwright:v1.58.0-noble

WORKDIR /work

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

CMD ["npx", "playwright", "test"]
