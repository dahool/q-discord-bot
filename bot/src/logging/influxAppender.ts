import { InfluxDBClient, Point } from '@influxdata/influxdb3-client';
import { Appender, BaseAppender, LogEvent } from "@tsed/logger";
import * as _ from 'lodash';
import { setTimeout } from 'timers/promises';

@Appender({name: "influxAppender", defaultLayout: "messagePassThrough"})
export class InfluxAppender extends BaseAppender {
    
    appenderConfig = {
        host: undefined,
        database: 'logging_db',
        token: undefined,
        measurement: undefined,
        fields: ['data'],
        tags: ['level', 'fileName'],
        maxBatchSize: 10
    }

    buffer: any[] = [];
    isConnected = false;
    canWrite = false;
    shutdownAttempts = 5;
    client!: InfluxDBClient;
    
    build() {
        Object.assign(this.appenderConfig, this.config);
        console.debug(
            `constructor: creating InfluxAppender with host ${this.appenderConfig.host}
                database ${this.appenderConfig.database}
                fields  ${this.appenderConfig.fields}
                tags  ${this.appenderConfig.tags}`,
        );

        this.client = new InfluxDBClient({
            host: this.appenderConfig.host!,
            token: this.appenderConfig.token,
            database: this.appenderConfig.database
        });
        this.writeBuffer().then(() => this.isConnected = true);
    }

    shutdown(): Promise<void> {
        return new Promise(resolve => {
            console.debug("Appender shutdown")
            if (this.buffer.length && this.shutdownAttempts) {
                console.debug("empty appender buffer")
                if (this.isConnected) {
                    this.writeBuffer().then(() => {
                        this.shutdown().then(() => resolve());
                    });
                } else {
                    console.debug('cannot connect, waiting 100ms to retry');
                    this.shutdownAttempts--;
                    setTimeout(100).then(() => {
                        this.shutdown().then(() => resolve());
                    })
                }
            } else {
                this.isConnected = false;
                this.client.close();
                resolve();
            }
        })
    }

    shouldWriteBatch() {
        return this.buffer.length >= this.appenderConfig.maxBatchSize;
    }

    getMeasurement(property: string, event: LogEvent): string {
        return event.categoryName || event.context.get(property);
    }

    parseLogEvent(logEvent: LogEvent, fields: string[]) {
        let res = this.getKeys(logEvent, fields);
        if (fields.includes('level')) {
            res.level = this.formatLogLevel(logEvent);
        }
        if (fields.includes('message')) {
            res.message = logEvent.getMessage()
        }
        if (fields.includes('data')) {
            res.data = this.formatData(logEvent);
        } else {
            logEvent.data.forEach((elm) => {
                res = {
                    ...res,
                    ...this.getKeys(elm, fields),
                };
            });
        }
        return res;
    }

    processLogEvent(loggingEvent: LogEvent): Point {
        const measurement = this.appenderConfig.measurement || this.getMeasurement('categoryName', loggingEvent);

        const fields = this.parseLogEvent(loggingEvent, this.appenderConfig.fields);
        const tags = this.parseLogEvent(loggingEvent, this.appenderConfig.tags);

        const point = new Point(measurement)
            .timestamp(loggingEvent.startTime);

        for (var [k, v] of Object.entries(tags)) {
            point.tag(k, v as string);
        }
        for (var [k, v] of Object.entries(fields)) {
            point.stringField(k, v);
        }

        return point;
    }

    write(loggingEvent: LogEvent) {
        if (this.canWrite) {
            // prepare logging event
            this.buffer.push(this.processLogEvent(loggingEvent));
            if (this.canWrite && this.shouldWriteBatch()) {
                this.writeBuffer();
            }
        } else {
            // buffer blocked, wait and retry
            setTimeout(100).then(() => {
                this.write(loggingEvent);
            })
        }
    }

    async writeBuffer(): Promise<void> {
        this.canWrite = false;
        const newBuffer = [ ...this.buffer ];
        this.buffer = [];
        this.client.write(newBuffer).catch(err => {
            console.error(err);
        });
        // we don't need to wait, once the buffer was sent, return to normal execution
        this.canWrite = true;
    }

    getKeys(obj: any, keys: any) {
        return _.pick(obj, keys);
    }

    formatLogLevel(logEvent: LogEvent) {
        return logEvent.level.toString();
    }

    formatData(logEvent: LogEvent) {
        return this.layout(logEvent);
    }
   
}
