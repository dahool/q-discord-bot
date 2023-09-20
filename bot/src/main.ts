import "reflect-metadata";
import { BotCommander } from "./bot";
import { environment } from "./env/environment";
import { createDatabaseConnection } from "./repository";

import { TYPES, container } from "./ic.config";
import { initializeWebListener } from "./web";

createDatabaseConnection(environment.database.url!).then(() => {
    const bot = new BotCommander("TEST", environment.discord.test);
    bot.login(environment.discord.token!);

    container.set(TYPES.Bot, bot);
    
    initializeWebListener();
    
}).catch(error => {
    console.error(error);
});