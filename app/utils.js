const { DateTime } = require('luxon');
const { MessageMentions } = require('discord.js');

const COLORS = [
    '#ff00ff',
    '#0099ff',
    '#00cc00',
    '#ff0000',
    '#ff6600',
    '#6600ff',
    '#cc99ff'
];

const units = [
    'year',
    'month',
    'week',
    'day',
    'hour',
    'minute',
    'second',
];
/*
const CHANNEL_ID = /<#(\d+)+>/;
const ROLE_ID = /<@&(\d+)+>/;
const USER_ID = /<@(\d+)+>/;
*/

function randomId(prefix) {
    return prefix + Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
}

function asTime(dateTime) {
    return '<t:' + Math.trunc(dateTime.toSeconds()) + '>'
}

function asTimeRelative(dateTime) {
    return '<t:' + Math.trunc(dateTime.toSeconds()) + ':R>'
}

function asTimeFormat(dateTime, format = 'F') {
    var dt = dateTime;
    if (!(dateTime instanceof DateTime)) {
        dt = DateTime.fromJSDate(dateTime);
    }
    return '<t:' + Math.trunc(dt.toSeconds()) + ':' + format + '>'
}

function asChannel(number) {
    return '<#' + number + '>'
}

function asRole(number) {
    return '<@&' + number + '>'
}

function asUser(number) {
    return '<@' + number + '>'
}

function extract_id(regex, str) {
	const m = regex.exec(str);
	if (m) {
		return m[++m.index];
	}
	return null;
}

function extract_role(str) {
    return extract_id(MessageMentions.RolesPattern, str);
}

function extract_user(str) {
    return extract_id(MessageMentions.UsersPattern, str);
}

function extract_channel(str) {
    return extract_id(MessageMentions.ChannelsPattern, str);
}

function randomColor() {
	return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function safeLower(value) {
    if (value != undefined) return value.toLowerCase();
    return value;
}

function safeTrim(value) {
    if (value != undefined) return value.trim();
    return value;
}

function isPresent(value) {
    return value != undefined && value != null;
}

function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
         const key = keyGetter(item);
         const collection = map.get(key);
         if (!collection) {
             map.set(key, [item]);
         } else {
             collection.push(item);
         }
    });
    return map;
}

capitalize = (string) => {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function StringBuilder() {
    this.__strings__ = new Array;
}
 
StringBuilder.prototype.append = function (str) {
    this.__strings__.push(str);
	return this;
};
 
StringBuilder.prototype.toString = function () {
    return this.__strings__.join("");
};

toDateTime = (value) => {
    if (value instanceof DateTime) {
        console.log(value + "is datetime");
        return value;
    }
    if (value instanceof Date) {
        console.log(value + "is Date");
        return DateTime.fromJSDate(value);
    }
    if (isNaN(value)) {
        console.log(value + "is number");
        return DateTime.fromMillis(value);
    }
    return null;
}

toRelative = (dateTime) => {
    const diff = dateTime.diffNow().shiftTo(...units);
    const udf = units.filter((unit) => diff.get(unit) !== 0)
    const now = DateTime.now();
  
    const s = new StringBuilder();
    if (dateTime > now) {
      s.append("in ")
    }
    for (i = 0; i < udf.length && i < 2; i++) {
      const v = Math.abs(diff.get(udf[i]));
      s.append(v).append(" ").append(udf[i]);
      if (v > 1) {
        s.append("s");
      }
      s.append(" ")
    }
    if (dateTime < now) {
      s.append("ago");
    }
    return s.toString()
}

function isEmpty(obj){
    return (Object.keys(obj).length === 0 && JSON.stringify(obj) === JSON.stringify({}));
}
  
createURLwithParameters = (baseURL,parameters) => {
    if(!isEmpty(parameters)){
        var obj = parameters;
        var cnt = 0;
        for (var prop in obj) {
            if( cnt == 0 ) 
            baseURL = baseURL.concat('?',prop,'=',obj[prop]);
            else
            baseURL = baseURL.concat('&',prop,'=',obj[prop]); 
            cnt++;         
        }
    }
    return baseURL;
}

module.exports = {
    createURLwithParameters,
    isEmpty,
	groupBy,
	randomColor,
    safeLower,
    safeTrim,
    capitalize,
    StringBuilder,
    toRelative,
    extract_channel,
    extract_role,
    extract_user,
    asTime,
    asRole,
    asChannel,
    asUser,
    asTimeRelative,
    asTimeFormat,
    randomId,
    isPresent,
    toDateTime
};