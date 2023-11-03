import { ApplicationCommandType, BaseInteraction, Client, ClientEvents, GatewayIntentBits } from "discord.js";

export const Type = Function;

export function isType(v: any): v is Type<any> {
    return typeof v === 'function';
}

export interface Type<T> extends Function { new (...args: any[]): T; }  

export interface CommandDefinition {
    attrs: CommandAttributes;
    instance: DiscordCommand;
}

export interface ListenerDefinition {
    attrs: ListenerAttributes;
    instance: DiscordEventListener;
}

export interface ChoiceItem {
    name: string;
    value: string;
}

export interface CommandOptions {
    name: string;
    description: string;
    type: number;
    required: boolean;
    choices?: ChoiceItem[];
}

export interface CommandAttributes {
    name: string;
    description?: string;
    type?: ApplicationCommandType;
    admin?: boolean;
    options?: CommandOptions[];
    requiresIntents?: GatewayIntentBits[];
    defaultPermissions?: bigint;
}

export interface ListenerAttributes {
    event: keyof ClientEvents | string[];
    once?: boolean;
    requiresIntents?: GatewayIntentBits[];
}

export interface DiscordCommand {
    //run(...args: any[]): Promise<void>;
    run(client: Client, interaction: BaseInteraction, args: any): Promise<any>;
}

export interface DiscordEventListener {
    onEvent(client: Client, ...args: any): Promise<any>;
}
