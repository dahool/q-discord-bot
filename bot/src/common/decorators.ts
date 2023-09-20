import "reflect-metadata";
import { CommandAttributes, DiscordCommand, DiscordEventListener, ListenerAttributes, Type } from "./schemas";

export const CommandMetadata = "CommandAttributes";
export const ListenerMetadata = "EventAttributes";

export const Command = (attrs: CommandAttributes) => {
    return (target: Type<DiscordCommand>) => {
        Reflect.defineMetadata(CommandMetadata, attrs, target.prototype);
    }
}

export const EventListener = (attrs: ListenerAttributes) => {
    return (target: Type<DiscordEventListener>) => {
        Reflect.defineMetadata(ListenerMetadata, attrs, target.prototype);
    }
}