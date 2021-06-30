FROM node:16-slim

RUN addgroup appuser && adduser --system --ingroup appuser appuser
RUN mkdir /usr/app
COPY app /usr/app
RUN chown -R appuser:appuser /usr/app

# install pm2 globally
RUN npm install pm2 -g

# switch to local user and install node modules
USER appuser
WORKDIR /usr/app

RUN npm install

ENTRYPOINT ["pm2-runtime","process.yml"]