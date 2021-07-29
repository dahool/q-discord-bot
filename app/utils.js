const COLORS = [
    '#ff00ff',
    '#0099ff',
    '#00cc00',
    '#ff0000',
    '#ff6600',
    '#6600ff',
    '#cc99ff'
];

function randomColor() {
	return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function safeLower(value) {
    if (value != undefined) return value.toLowerCase();
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


module.exports = {
	groupBy,
	randomColor,
    safeLower,
    capitalize,
    StringBuilder
};