# build
FROM node:18 AS build

RUN npm install -g pnpm@~8

# create build directory and copy everything
COPY . /usr/build

# build dashboard
WORKDIR /usr/build/web
RUN pnpm install \
    && pnpm run build

# build bot
WORKDIR /usr/build/bot
RUN pnpm install \
    && pnpm run build \
    && pnpm prune --prod

# prepare for distribution
RUN cp -R /usr/build/bot/public /usr/build/dist/ \
    && cp /usr/build/pm/* /usr/build/dist

# server
FROM node:18-alpine

RUN npm install -g pm2@~5.3

RUN mkdir /usr/app \
    && addgroup appuser && adduser --system --ingroup appuser appuser \
    && chown -R appuser:appuser /usr/app
USER appuser

COPY --from=build /usr/build/dist /usr/app
COPY --from=build /usr/build/bot/node_modules /usr/app/node_modules

WORKDIR /usr/app

EXPOSE 3000

ENTRYPOINT ["pm2-runtime","process.json"]