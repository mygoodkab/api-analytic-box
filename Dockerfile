FROM node:boron-alpine

WORKDIR /home/root/

RUN apk add --no-cache curl

COPY package.json .

RUN npm rebuild

COPY . .

EXPOSE 8000

ENV DEBUG=http,app:log,app:error,worker:a

CMD ["node", "dist/server.js" ]
