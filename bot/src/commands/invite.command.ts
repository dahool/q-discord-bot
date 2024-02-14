import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { ConfigModel, GuildInviteRolesModel } from "@/repository";
import { ApplicationCommandOptionType, BaseGuildTextChannel, ChatInputCommandInteraction, Client, EmbedBuilder, GuildMemberRoleManager, PermissionFlagsBits, Role, roleMention, time } from "discord.js";
import { DateTime } from "luxon";

@Command({
	name: 'createinvite',
	description: 'Create Invite with Automatically Assigned Roles',
	options: [
    {
        name: 'daystolive',
        description: 'Days To Live',
        type: ApplicationCommandOptionType.Integer,
        required: true
    },
    {
        name: 'role1',
        description: 'Role To Assign',
        type: ApplicationCommandOptionType.Role,
        required: true
	},
    {
		name: 'role2',
		description: 'Role To Assign',
		type: ApplicationCommandOptionType.Role,
		required: false
	},
    {
		name: 'role3',
		description: 'Role To Assign',
		type: ApplicationCommandOptionType.Role,
		required: false
	},
    {
		name: 'role4',
		description: 'Role To Assign',
		type: ApplicationCommandOptionType.Role,
		required: false
	},
    {
		name: 'role5',
		description: 'Role To Assign',
		type: ApplicationCommandOptionType.Role,
		required: false
	}]
})
export class CreateInviteCommand implements DiscordCommand {

	async run(client: Client, interaction: ChatInputCommandInteraction, args: any): Promise<any> {
		
		await interaction.deferReply();

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.CreateInstantInvite)) {
            return interaction.editReply({ content: "Sorry, you cannot create invites for this server" });
        }

        const guild = interaction.guild!;

        const highestRole = (interaction.member?.roles as GuildMemberRoleManager).highest.position;
        const highestBotRole = guild.members.me?.roles.highest.position || 0;

        let roles: Role[] = [];
        for (let i = 1; i < 6; i++) {
            const argValue = args['role' + i];
            if (argValue != undefined) {
                const role = guild.roles.cache.get(argValue);
                if (role) {
                    if (role.managed) {
                        return interaction.editReply({ content: `Sorry, \`${role.name}\` is a managed role. It cannot be assigned.` });
                    }
                    if (highestRole <= role.position) {
                        return interaction.editReply({ content: `Sorry, \`${role.name}\` is higher rank than you. You cannot assign this role.` });
                    }
                    if (highestBotRole <= role.position) {
                        return interaction.editReply({ content: `Sorry, \`${role.name}\` is higher rank than me. I cannot assign this role.` });
                    }
                    roles.push(role);
                }
            }
        }
        /*
        const maxRolePosition = roles.reduce(
            (accumulator, currentValue) => currentValue.position > accumulator ? currentValue.position : accumulator,
            0,
        );

        if (highestRole <= maxRolePosition) {
            logger.error(`Highest Role is ${highestRole} - Max Role is ${maxRolePosition}`);
            return interaction.editReply({ content: "Sorry, you can only assign roles lowers than the one you have" });
        }

        if (highestBotRole <= maxRolePosition) {
            logger.error(`Highest BOT Role is ${highestBotRole} - Max Role is ${maxRolePosition}`);
            return interaction.editReply({ content: "Sorry, there are some roles I'm not allowed to assign. I need more privileges." });
        }
        */
        const config = await ConfigModel.findOne({guild: guild.id}).exec();
        
        let channel = guild.systemChannel as BaseGuildTextChannel;
        if (config?.channels?.invitesChannel !== undefined) {
            channel = guild.channels.cache.get(config.channels.invitesChannel) as BaseGuildTextChannel;
        }
        if (channel == null || channel === undefined) {
            channel = interaction.channel as BaseGuildTextChannel;
        }

        return channel.createInvite({maxAge: args.daystolive * 86400, unique: true}).then(invite => {
            let roleArray = [... new Set(roles.map(r => r.id))];
            GuildInviteRolesModel.create({guild: guild.id, code: invite.code, roles: roleArray, created: new Date(), expiration: args.daystolive});
            
            const msgEmbed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Discord Invite")
                .setThumbnail(interaction.guild ? interaction.guild.iconURL() : interaction.client.user.avatarURL())
            
            msgEmbed.addFields(
                {name: "Link", value: invite.url},
                {name: "Code", value: invite.code},
                {name: "Expires", value: time(DateTime.now().plus({days: args.daystolive}).toJSDate(), 'R') }
            )
            
            if (roleArray.length > 0) {
                msgEmbed.addFields(
                    {name: "Roles", value: roleArray.map(id => roleMention(id)).join("\n")}
                )
            }

            interaction.editReply({ embeds: [ msgEmbed ]});
        })

	}

}
