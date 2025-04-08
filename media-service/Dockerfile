FROM node:18-alpine

WORKDIR /use/src/app

COPY package*.json ./

RUN pnpm ci --only=production

COPY . .

EXPOSE 7003

CMD ["node", "src/index.js"]