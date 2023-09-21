import "reflect-metadata";
import { BotCommander } from "./bot";
import { environment } from "./env/environment";
import { closeDatabaseConnection, createDatabaseConnection } from "./repository";

import TelegramBot from "node-telegram-bot-api";
import { TYPES, container } from "./ic.config";
import { logger } from "./logging/logger";
import { initializeWebListener } from "./web";

const gramBot = new TelegramBot(environment.telegram.token || '', {polling: false});
const bot = new BotCommander("TEST", environment.discord.test);

function sendMessage(message: string): Promise<any> {
    if (environment.telegram.recipientId) {
        return gramBot.sendMessage(environment.telegram.recipientId, message);
    }
    return Promise.resolve();
}

process.on('SIGINT', function() {
    logger.info("Shutting down");
    logger.shutdown();
    sendMessage(`[${process.env.LOGGING_MES}] Q Bot stopped`).then(() => {
        gramBot.close();
    })
    bot.stop();
    closeDatabaseConnection().then(() => {
        process.exit(0);
    })
});

createDatabaseConnection(environment.database.url!).then(() => {
    
    bot.login(environment.discord.token!).then(() => {
       sendMessage(`[${process.env.LOGGING_MES}] Q Bot ready`);
    });

    container.set(TYPES.Bot, bot);
    
    initializeWebListener();
    
}).catch(error => {
    console.error(error);
});