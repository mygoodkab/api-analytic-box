FROM node:boron-alpine

RUN apk add --no-cache curl

ADD run.sh /run.sh

RUN chmod 755 /run.sh

CMD '/run.sh'
