FROM node:boron-alpine

WORKDIR /home/root/

RUN apk add --no-cache curl

COPY package.json .

RUN npm rebuild

COPY . .

EXPOSE 8000

ENV DEBUG=http,worker:a,worker:sendData

ENV DEBUG_COLORS=true

CMD ["node", "dist/server.js" ]
