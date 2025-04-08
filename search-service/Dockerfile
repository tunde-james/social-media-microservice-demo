FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /use/src/app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile --prod

COPY . .

EXPOSE 7004

CMD ["node", "src/server.js"]