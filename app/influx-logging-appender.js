const debug = require('debug')('log4js:influxdb');
const _ = require('lodash');
const { InfluxDBClient, Point } = require('@influxdata/influxdb3-client');

function influxAppender(
    host,
    database,
    token,
    configMeasurement,
    configFields,
    configTags,
    maxBatchSize,
    layout,
) {
    debug(
        `constructor: creating InfluxAppender with host ${host}
            database ${database}
            fields  ${configFields}
            tags  ${configTags}`,
    );
    let buffer = [];
    let isConnected = false;
    let canWrite = false;
    let shutdownAttempts = 5;
    let client;

    function formatLogLevel(logEvent) {
        return logEvent.level.toString();
    }

    function formatData(logEvent) {
        return layout(logEvent);
    }

    function getKeys(obj, keys) {
        return _.pick(obj, keys);
    }

    const getMeasurement = (property, event) =>
        event.context.measurement || event[property] || event.context[property]; // eslint-disable-line implicit-arrow-linebreak

    const shouldWriteBatch = () => buffer.length >= maxBatchSize;

    const parseLogEvent = (logEvent, fields) => {
        let res = getKeys(logEvent, fields);
        if (fields.includes('level')) {
            res.level = formatLogLevel(logEvent);
        }
        if (fields.includes('data')) {
            res.data = formatData(logEvent);
        } else {
            logEvent.data.forEach((elm) => {
                res = {
                    ...res,
                    ...getKeys(elm, fields),
                };
            });
        }

        return res;
    };

    function processLogEvent(loggingEvent) {
        const measurement = configMeasurement || getMeasurement('categoryName', loggingEvent);

        const fields = parseLogEvent(loggingEvent, configFields);
        const tags = parseLogEvent(loggingEvent, configTags);

        const point = new Point(measurement)
            .timestamp(loggingEvent.startTime);

        for (var [k, v] of Object.entries(tags)) {
            point.tag(k, v);
        }
        for (var [k, v] of Object.entries(fields)) {
            point.stringField(k, v);
        }

        if ('ERROR' == formatLogLevel(loggingEvent)) {
            point.stringField("trace", loggingEvent.callStack);
        }

        return point;
    }

    function write() {
        canWrite = false;
        client.write(buffer.map((logEvent) => processLogEvent(logEvent)), database).catch((err) => {
            console.error(err);
        });
        buffer = [];
        canWrite = true;
    }

    function emptyBuffer() {
        debug(`emptying buffer of size ${buffer.length}`);
        write();
    }

    function createClient() {
        debug('creating client.');
        client = new InfluxDBClient({ host, token });
        emptyBuffer();
        canWrite = true;
        isConnected = true;
        return client;
    }

    createClient();

    function log(loggingEvent) {
        buffer.push(loggingEvent);
        if (canWrite && shouldWriteBatch()) {
            write();
        }
    }

    log.shutdown = (cb) => {
        debug('shutdown called');

        if (buffer.length && shutdownAttempts) {
            debug('buffer has items, trying to empty');
            if (isConnected) {
                canWrite = false;
                emptyBuffer();
            } else {
                debug('cannot connect, waiting 100ms to empty');
            }
            shutdownAttempts -= 1;
            setTimeout(() => {
                log.shutdown(cb);
            }, 100);
        } else {
            isConnected = false;
            client.close();
            cb();
        }
    };

    return log;
}

function configure(config, layouts) {
    let layout = layouts.messagePassThroughLayout;
    if (config.layout) {
        debug(`custom layout ${config.layout.type}`);
        layout = layouts.layout(config.layout.type, config.layout);
    }
    debug('configuring new appender');
    return influxAppender(
        config.host,
        config.database || 'log4js_db',
        config.token,
        config.measurement,
        config.fields || ['data'],
        config.tags || ['level', 'pid'],
        config.maxBatchSize || 1,
        layout,
    );
}

module.exports.configure = configure;