# build
FROM node:22 AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

#RUN corepack enable
RUN npm install -g pnpm@9

# create build directory and copy everything
COPY . /usr/build

# build dashboard
WORKDIR /usr/build/nextdashboard
RUN pnpm install --frozen-lockfile \
    && pnpm build

# build bot
WORKDIR /usr/build/bot
RUN pnpm install --frozen-lockfile \
    && pnpm build \
    && pnpm prune --prod

# prepare for distribution
RUN cp -R /usr/build/bot/public /usr/build/dist/ \
    && cp /usr/build/pm/* /usr/build/dist

# server
FROM node:22-alpine

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN apk update && apk add caddy

RUN npm install -g pm2@~5

RUN mkdir /usr/app \
    && addgroup appuser && adduser --system --ingroup appuser appuser \
    && chown -R appuser:appuser /usr/app

WORKDIR /usr/app

COPY --from=build /usr/build/proxy/Caddyfile /etc/caddy/

COPY --from=build --chown=appuser:appuser /usr/build/nextdashboard/public ./public
COPY --from=build --chown=appuser:appuser /usr/build/nextdashboard/.next/standalone ./
COPY --from=build --chown=appuser:appuser /usr/build/nextdashboard/.next/static ./.next/static

COPY --from=build --chown=appuser:appuser /usr/build/pm /usr/app
COPY --from=build --chown=appuser:appuser /usr/build/dist /usr/app/bot
COPY --from=build --chown=appuser:appuser /usr/build/bot/node_modules /usr/app/bot/node_modules

USER appuser

EXPOSE 80

ENTRYPOINT ["./entrypoint.sh"]

#ENTRYPOINT ["pm2-runtime","process.json"]