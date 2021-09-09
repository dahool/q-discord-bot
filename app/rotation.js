
const { DateTime } = require("luxon");
const fs = require('fs');

const rotationFile = './commands/dailiesrotation.json'

let start = DateTime.fromObject({ year: 2021, month: 8, day: 30})
const stop = start.plus({days: 730});

const days = [];

while (start < stop) {
	for (let i = 1; i <= 11; i++) {
		days.push({rotation: i, rotationDay: start.toFormat('yyyy-MM-dd')})
		start = start.plus({days: 1});
	}
}

let data = JSON.stringify(days);
fs.writeFileSync(rotationFile, data);
