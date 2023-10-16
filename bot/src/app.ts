import * as commands from "./commands";
import * as listeners from "./listeners";

import { AppModules } from "./common/modules";

export const application = new AppModules()

for (let cmd of Object.values(commands)) {
    application.register(cmd);
}

for (let cmd of Object.values(listeners)) {
    application.register(cmd);
}