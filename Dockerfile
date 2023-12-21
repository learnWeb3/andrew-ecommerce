FROM node:20.9.0-alpine3.17 As builder

USER root

WORKDIR /usr/share/app/

RUN apk add --no-cache openssh-client git
RUN mkdir -p -m 0700 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts
RUN --mount=type=ssh

RUN npm i --global @nestjs/cli

COPY package.json ./

RUN --mount=type=ssh npm install --verbose

COPY . .

RUN npm run build


FROM node:20.9.0-alpine3.17 As production

RUN apk update && apk add --no-cache tini 

WORKDIR /usr/share/app/

COPY --from=builder /usr/share/app/node_modules ./node_modules
COPY --from=builder /usr/share/app/dist ./dist

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "/usr/share/app/dist/main.js"]