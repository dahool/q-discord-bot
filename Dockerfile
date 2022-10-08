# build
FROM node:16 AS build

RUN npm install -g npm@latest

# create build directory and copy everything
RUN mkdir /usr/build
COPY . /usr/build

# build dashboard
WORKDIR /usr/build/front
RUN npm install
RUN npm run build

# build bot
WORKDIR /usr/build/app
RUN npm install --omit=dev

# server
FROM alpine

RUN apk add --update nodejs npm

# update npm
RUN npm install -g npm@latest
RUN npm install -g pm2@latest

RUN addgroup appuser && adduser --system --ingroup appuser appuser
RUN mkdir /usr/app

COPY --from=build /usr/build/app /usr/app

RUN chown -R appuser:appuser /usr/app

# switch to local user
USER appuser
WORKDIR /usr/app

EXPOSE 3000

ENTRYPOINT ["pm2-runtime","process.json"]
