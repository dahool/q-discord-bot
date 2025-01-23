import { TranslatorClient } from "@/api/translator";
import { Command, EventListener } from "@/common/decorators";
import { DiscordCommand, DiscordEventListener } from "@/common/schemas";
import { logger } from "@/logging/logger";
import { ConfigModel } from "@/repository";
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Client, Events, IntentsBitField, Message, MessageContextMenuCommandInteraction, MessageFlags } from "discord.js";

function splitIntoParagraph(text: string) {
    if (text.length < 2000) {
        return [text];
    }
    const paragraphs = text.split('\n');
    const sections: string[] = [];
    let current = '';
    for (const paragraph of paragraphs) {
        if ((current.length + paragraph.length + 4) < 2000) {
            current += '\n' + paragraph;
        } else {
            sections.push(current);
            current = paragraph;
        }
    }
    if (current.length > 0) {
        sections.push(current);
    }
    return sections;
}

@Command({
	name: 'translate',
	description: 'Translate Text',
	options: [{
		name: 'text',
		description: 'Text to translate',
		type: ApplicationCommandOptionType.String,
		required: true
	},
    {
		name: 'to',
		description: 'Translate to Language',
		type: ApplicationCommandOptionType.String,
		required: true,
		choices: [
			{name: 'English', value: 'en'},
			{name: 'Spanish', value: 'es'},
            {name: 'French', value: 'fr'}
		]
	},{
		name: 'from',
		description: 'Translate from Language (optional)',
		type: ApplicationCommandOptionType.String,
		required: false,
		choices: [
            {name: '(Autodetect)', value: 'auto'},
			{name: 'English', value: 'en'},
			{name: 'Spanish', value: 'es'},
            {name: 'French', value: 'fr'}
		]
	}]
})
export class TranslateCommand implements DiscordCommand {

	async run(client: Client, interaction: ChatInputCommandInteraction, args: any): Promise<any> {
		
		await interaction.deferReply();

        const translator = new TranslatorClient();

        try {
            const response = await translator.translate(args.text, args.to, args.from == undefined 
                || args.from == 'auto' ? undefined : args.from);

            let content = response.text.concat("\n\n>>> " + args.text);
            return interaction.editReply({ content: content });                
        } catch (error) {
            logger.error(error);
            return interaction.editReply({ content: "Sorry, there was an error processing your request" });                
        }

	}

}

@Command({
	name: 'Translate',
    type: ApplicationCommandType.Message
})
export class TranslatePrivateContextCommand implements DiscordCommand {

	async run(client: Client, interaction: MessageContextMenuCommandInteraction): Promise<any> {
		
		await interaction.deferReply({ephemeral: true});

        const translator = new TranslatorClient();

        logger.debug("Context translation %O", interaction.targetMessage);

        const text = interaction.targetMessage.content;

        const lang = await translator.detectLanguage(text);
        let translateTo = lang != 'es' ? 'es' : 'en';

        try {
            const response = await translator.translate(text, translateTo, lang);
            await interaction.editReply({ content: (translateTo == 'es' ? 'Traducido desde ' : 'Translated from ') + '`'+lang+'`'});
            for (const text of splitIntoParagraph(response.text)) {
                await interaction.followUp({ content: text, ephemeral: true });
            }
        } catch (error) {
            logger.error(error);
            return interaction.editReply({ content: "Sorry, there was an error processing your request" });
        }

	}

}

@Command({
	name: 'TranslateAndPost',
    type: ApplicationCommandType.Message
})
export class TranslateContextCommand implements DiscordCommand {

	async run(client: Client, interaction: MessageContextMenuCommandInteraction): Promise<any> {
		
		await interaction.deferReply({ephemeral: true});

        const translator = new TranslatorClient();

        logger.debug("Context translation %O", interaction.targetMessage);

        const text = interaction.targetMessage.content;

        const lang = await translator.detectLanguage(text);
        let translateTo = lang != 'es' ? 'es' : 'en';

        try {
            const response = await translator.translate(text, translateTo, lang);
            // texts should be posted in order
            for (const text of splitIntoParagraph(response.text)) {
                await interaction.channel?.send({ content: `:flag_${translateTo}:\n${text}`, flags: MessageFlags.SuppressNotifications });
            }
            return interaction.editReply({ content: (translateTo == 'es' ? 'Traducido desde ' : 'Translated from ') + '`'+lang+'`'});
        } catch (error) {
            logger.error(error);
            return interaction.editReply({ content: "Sorry, there was an error processing your request" });
        }

	}

}

@EventListener({
    event: Events.MessageCreate,
    requiresIntents: [ IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent ]
})
export class AutomaticPostTranslator implements DiscordEventListener {

    async onEvent(client: Client<boolean>, message: Message): Promise<any> {
        if (!message.member?.user.bot) { // ignore any bot post, including myself
            const config = await ConfigModel.findOne({guild: message.guildId}).exec();
            if (config && config.translateChannels != undefined) {
                const translateConfig = config.translateChannels.find(c => message.channelId == c.channel);
                if (translateConfig != undefined) {
                    logger.debug("Translating '%s'", message.content);
                    const translator = new TranslatorClient();
                    const response = await translator.translate(message.content, translateConfig.language);
                    for (const text of splitIntoParagraph(response.text)) {
                        await message.channel.send({ content: `:flag_${translateConfig.language}:\n${text}`, flags: MessageFlags.SuppressNotifications });
                    }
                }
            }
        }
    }

}