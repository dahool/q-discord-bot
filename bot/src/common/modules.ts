import { CommandMetadata, ListenerMetadata } from "./decorators";
import { CommandDefinition, DiscordCommand, DiscordEventListener, ListenerDefinition, Type } from "./schemas";

export class AppModules {

    registeredCommands: CommandDefinition[] = [];
 
    registeredListeners: ListenerDefinition[] = [];

    register(element: Type<DiscordCommand> | Type<DiscordEventListener>): void {
        const singleInstance = new element();

        let attrs = Reflect.getMetadata(CommandMetadata, element.prototype);
        
        if (attrs !== undefined) {
            this.registeredCommands.push({attrs: attrs, instance: singleInstance as DiscordCommand});
        }

        attrs = Reflect.getMetadata(ListenerMetadata, element.prototype);
        if (attrs !== undefined) {
            this.registeredListeners.push({attrs: attrs, instance: singleInstance as DiscordEventListener});
        }        
    }

    getCommands(): CommandDefinition[] {
        return this.registeredCommands;
    }

    getListeners(): ListenerDefinition[] {
        return this.registeredListeners;
    }

}