# build
FROM node:18 AS build

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
FROM node:18-alpine

ENV NODE_ENV production

RUN npm install -g pm2@latest

RUN addgroup appuser && adduser --system --ingroup appuser appuser
RUN mkdir /usr/app

RUN chown -R appuser:appuser /usr/app

# switch to local user
USER appuser

COPY --from=build /usr/build/app /usr/app
WORKDIR /usr/app

EXPOSE 3000

ENTRYPOINT ["pm2-runtime","process.json"]
