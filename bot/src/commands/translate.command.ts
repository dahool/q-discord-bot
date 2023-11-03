import { TranslatorClient } from "@/api/translator";
import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, Client } from "discord.js";

@Command({
	name: 'translate',
	description: 'Show Guild Member Info',
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
            return interaction.editReply({ content: "Sorry, there was an error processing your request" });                
        }

	}

}
