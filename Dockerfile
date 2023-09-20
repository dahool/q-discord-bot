# build
FROM node:18 AS build

# create build directory and copy everything
COPY . /usr/build

# build dashboard
WORKDIR /usr/build/front
RUN npm install \
    && npm run build

# build bot
WORKDIR /usr/build/bot
RUN npm install \
    && npm run build \
    && npm prune --production

# prepare for distribution
RUN cp -R /usr/build/bot/public /usr/build/dist/ \
    && cp /usr/build/pm/* /usr/build/dist

# server
FROM node:18-alpine

ENV NODE_ENV production

RUN npm install -g pm2@latest

RUN mkdir /usr/app \
    && addgroup appuser && adduser --system --ingroup appuser appuser \
    && chown -R appuser:appuser /usr/app
USER appuser

COPY --from=build /usr/build/dist /usr/app
COPY --from=build /usr/build/bot/node_modules /usr/app/node_modules

WORKDIR /usr/app

EXPOSE 3000

ENTRYPOINT ["pm2-runtime","process.json"]
