const dotenv = require('dotenv');
dotenv.config();

const { connectionManager, db } = require('./db/db');
const zones = require('./commands/data/zones.json');

find_by_name = (name) => {
	return zones.filter(z => z.zone.includes(name))[0]
}

connectionManager.connect().then(() => {
	db.calendar.findBy({
		type: 'territory',
		notified: false
	}).then((items) => {
		items.forEach((item) => {
			const zone = find_by_name(item.location);
			if (zone) {
				let d = 60;
				if (zone.type == 1) {
					d = 30;
				} else if (zone.type == 2) {
					d = 45;
				}
				console.log("Update", item.location, "duration", d);
				db.calendar.updateOne(item._id, {duration: d});
			} else {
				console.log("Not found", item.location);
			}
		})
	})
})

