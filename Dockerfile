FROM node:boron-alpine

WORKDIR /home/root/

RUN apk add --no-cache curl

COPY package.json .

RUN npm rebuild

COPY . .

EXPOSE 8000

CMD [ "node", "dist/server.js" ]
