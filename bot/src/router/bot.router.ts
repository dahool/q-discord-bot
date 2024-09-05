
import { DAILY_TASKS, FREQ_TASKS, MID_DAILY_TASKS } from '@/cron';
import { loadCalendarEvents, serveCalendar } from '@/cron/calendar';
import { executeCrawler } from '@/cron/crawler';
import { processAnnouncements } from '@/cron/notification';
import { openAllThreads } from '@/cron/threadopen';
import { container, TYPES } from '@/ic.config';
import { logger } from '@/logging/logger';
import { Body, Controller, Get, Param, Post, Query, Req, Res } from 'decorators-express';
import { Client, GuildTextBasedChannel } from 'discord.js';
import { Request, Response } from 'express';

async function runTasks(funcList: any): Promise<void> {
    for (let f of funcList) {
        await f();
    }
}

@Controller("/")
export class BotController {

    // deprecated
    @Get("/notify")
    notify(@Query("number") number: number, @Res() res: Response) {
        logger.debug("notify [%s]", number);
        processAnnouncements(number || 30).then(() => {
            res.send("OK");
        }).catch((e) => {
            logger.error(e);
            res.send(e);
        });
    }

    @Get("/bot")
    home(@Res() res: Response) {
        res.send("I'm alive");
    }

    @Get("/cron_daily")
    dailyCron(@Res() res: Response) {
        /*Promise.all(DAILY_TASKS.map(f => f())).then((r) => {
            res.send("OK");
        }).catch((e) => {
            logger.error(e);
            res.send(e);
        });*/
        runTasks(DAILY_TASKS).then(() => {
            res.send("OK");
        }).catch((e) => {
            logger.error(e);
            res.send(e);
        });        
    }

    @Get("/cron_midday")
    midDailyCron(@Res() res: Response) {
        /*Promise.all(MID_DAILY_TASKS.map(f => f())).then((r) => {
            res.send("OK");
        }).catch((e) => {
            logger.error(e);
            res.send(e);
        });*/
        runTasks(MID_DAILY_TASKS).then(() => {
            res.send("OK");
        }).catch((e) => {
            logger.error(e);
            res.send(e);
        });
    }


    @Get("/cron_freq")
    freqCron(@Res() res: Response) {
        /*Promise.all(FREQ_TASKS.map(f => f())).then(() => {
            res.send("OK");
        }).catch((e) => {
            logger.error(e);
            res.send(e);
        });*/
        runTasks(FREQ_TASKS).then(() => {
            res.send("OK");
        }).catch((e) => {
            logger.error(e);
            res.send(e);
        });
    }    
    
    // deprecated
    @Get("/crawler")
    crawler(@Res() res: Response) {
        logger.debug("crawler");
        executeCrawler().then(() => {
            res.send("OK");
        }).catch((e) => {
            logger.error(e);
            res.send(e);
        });
    }
    
    @Get("/calendar")
    calendarServer(@Req() req: Request, @Res() res: Response) {
        serveCalendar(req, res);
    }

    // deprecated
    @Get("/load")
    loadCalendar(@Req() req: Request, @Res() res: Response) {
        loadCalendarEvents().then(() => res.send("OK"));
    }    

    @Get("/threadOpener")
    threadOpener(@Res() res: Response) {
        logger.debug("threadOpener");
        openAllThreads().then(() => res.send("OK"));
    }
 
    @Post("publish")
    async publish(@Body() payload: {[key:string]: any}, @Res() res: Response) {
        
        console.log(payload);

        const client = container.get(TYPES.Bot).client as Client;
        const guild = client.guilds.cache.get(payload.guild);
        const channel = guild?.channels.resolve(payload.channel);

        if (channel && channel.isTextBased()) {
            if (payload.reply) {
                const message = await channel.messages.fetch(payload.reply);
                console.log(message);
                if (message) {
                    message.reply({content: payload.message})
                        .then(() => res.send("OK"))
                        .catch(e => res.send(e));
                } else {
                    res.send("NOK");        
                }
            } else {
                (channel as GuildTextBasedChannel).send({content: payload.message})
                .then(() => res.send("OK"))
                .catch(e => res.send(e));
            }
        } else {
            res.send("NOK");
        }

    }


    

}
