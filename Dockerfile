FROM node:boron-alpine

WORKDIR /home/root/

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8000

CMD [ "node", "dist/server.js" ]
