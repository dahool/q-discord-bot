
import { DAILY_TASKS, FREQ_TASKS, MID_DAILY_TASKS } from '@/cron';
import { loadCalendarEvents, serveCalendar } from '@/cron/calendar';
import { executeCrawler } from '@/cron/crawler';
import { processAnnouncements } from '@/cron/notification';
import { logger } from '@/logging/logger';
import { Controller, Get, Query, Req, Res } from 'decorators-express';
import { Request, Response } from 'express';

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

    @Get("/cron_daily")
    dailyCron(@Res() res: Response) {
        Promise.all(DAILY_TASKS.map(f => f())).then((r) => {
            res.send("OK");
        }).catch((e) => {
            logger.error(e);
            res.send(e);
        });
    }

    @Get("/cron_midday")
    midDailyCron(@Res() res: Response) {
        Promise.all(MID_DAILY_TASKS.map(f => f())).then((r) => {
            res.send("OK");
        }).catch((e) => {
            logger.error(e);
            res.send(e);
        });
    }


    @Get("/cron_freq")
    freqCron(@Res() res: Response) {
        Promise.all(FREQ_TASKS.map(f => f())).then(() => {
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

}
