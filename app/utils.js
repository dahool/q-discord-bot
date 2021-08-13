const { DateTime } = require('luxon');

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

module.exports = {
	groupBy,
	randomColor,
    safeLower,
    safeTrim,
    capitalize,
    StringBuilder,
    toRelative
};