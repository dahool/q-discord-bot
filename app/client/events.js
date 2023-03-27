const { GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } = require("discord.js");
const Discord = require("discord.js");
const { DateTime } = require("luxon");

/*
 * by default, all events in a channel will be voice
 * type: voice / general
 */
scheduleEvent = (guild, title, description, type, startTime, durationInMinutes, location) => {
    let endTime = startTime.plus({ minutes: durationInMinutes });
    let options = {
        name: title,
        description: description,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: type == 'voice' ? GuildScheduledEventEntityType.Voice : GuildScheduledEventEntityType.External
    };
    if (type == 'voice') {
        options['channel'] = location;
    } else {
        options['entityMetadata'] = {'location': location};
    }
    return guild.scheduledEvents.create(options);
}

deleteSchedule = async (guild, id) => {
    const event = await guild.scheduledEvents.fetch(id);
    return guild.scheduledEvents.delete(event);
}

module.exports = {
    scheduleEvent,
    deleteSchedule
};