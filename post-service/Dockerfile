FROM node:18-alpine

WORKDIR /use/src/app

COPY package*.json ./

RUN pnpm ci --only=production

COPY . .

EXPOSE 7002

CMD ["node", "src/index.js"]