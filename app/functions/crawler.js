const axios = require('axios');
const { db } = require('../db/db');

const getLogger = require('../logger')
const logger = getLogger();

const baseURL = "https://stfc.wtf/power/__data.json?server=36&sort=level&page=";

function parsePlayer(data, index) {
    const header = data[index];
    return {
        name: data[header.owner],
        level: data[header.level],
        tag: data[header.alliance_tag],
        power: data[header.score],
        pd: data[header.pd],
        rss: data[header.rss]
    }
}

function parseList(data) {
    let players = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i] != undefined && typeof data[i] === 'object' && 'owner' in data[i]) {
            players.push(parsePlayer(data, i));
        }
    }
    return players;
}

function parsePage(pageNumber, totalPages) {
    if (totalPages == undefined || (totalPages != undefined && pageNumber <= totalPages)) {
        return new Promise(resolv => {
            logger.debug("Requesting page " + baseURL + pageNumber);
            axios.get(baseURL + pageNumber)
            .then(res => {
                const data = res.data.nodes[1].data;
                if (pageNumber == 0) {
                    const totalItems = data[1];
                    const itemsPerPage = data[2];
                    totalPages = totalItems / itemsPerPage;
                }
                let list = parseList(data);
                parsePage(++pageNumber, totalPages).then((r) => {
                    resolv(list.concat(r));
                });
            })
            .catch(err => {
                logger.error('Error: ', err.message);
                resolv([]);
            });
        })
    }
    return new Promise(resolv => {
        resolv([]);
    });
}

async function insertPlayers(config, list) {
    for (gTag of config) {
        logger.debug("Processing " + gTag.tag);
        await db.player.deleteBy({guild: gTag.guild, tag: gTag.tag})
        const toInsert =  list.filter(player => player.tag == gTag.tag).map(player => Object.assign({}, player, {'guild': gTag.guild} ))
        if (toInsert.length > 0) await db.player.insertAll(toInsert);
    }
}

async function crawler() {
    const getTags = await db.config.findBy({uuid: 'playerInfo'});
    
    if (getTags.length > 0) {
        const list = await parsePage(0, undefined);
        await insertPlayers(getTags, list);
    }

    return true;
}

module.exports = { crawler };