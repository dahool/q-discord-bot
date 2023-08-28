const axios = require('axios');
const { db } = require('../db/db');

const baseURL = "https://stfc.wtf/power/__data.json?server=36&sort=level&page=";
const levelCache = {};
const allianceCache = {};

/*function parsePlayer(playerInfo) {
    let header = playerInfo[0];
    let player = {
        name: playerInfo[1],
    }
    // do we have a level and tag?
    if (typeof playerInfo[2] === 'string' || playerInfo[2] instanceof String) { // we have the tag here
        allianceCache[header.alliance_tag] = playerInfo[2];
        player['power'] = playerInfo[]
    } else if (typeof playerInfo[3] === 'string' || playerInfo[3] instanceof String) {
        levelCache[header.level] = playerInfo[2];
        allianceCache[header.alliance_tag] = playerInfo[3];
    } else if (!(header.level in levelCache)) {
        levelCache[header.level] = playerInfo[2];
    } 
    player['level'] = levelCache[header.level];
    player['alliance'] = allianceCache[header.alliance_tag];
    return player;
}*/

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
    // find start tag
    let startNode = 0;
    let endNode = 0;
    let players = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i] != undefined && typeof data[i] === 'object' && 'owner' in data[i]) {
            players.push(parsePlayer(data, i));
            /*if (startNode == 0) {
                startNode = i;
            } else if (startNode < i) {
                players.push(parsePlayer(data.slice(startNode, i)));
                startNode = i;
            }*/
        }
    }
    return players;
}

function parsePage(pageNumber, totalPages) {
    if (totalPages == undefined || (totalPages != undefined && pageNumber <= totalPages)) {
        return new Promise(resolv => {
            console.log("Requesting page " + baseURL + pageNumber);
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
                console.log('Error: ', err.message);
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
        console.log("Processing " + gTag.tag);
        await db.player.deleteBy({guild: gTag.guild, tag: gTag.tag})
        const toInsert =  list.filter(player => player.tag == gTag.tag).map(player => Object.assign({}, player, {'guild': gTag.guild} ))
        if (toInsert.length > 0) await db.player.insertAll(toInsert);
    }
}

async function crawler() {
    const getTags = await db.config.findBy({uuid: 'playerInfo'});
    
    if (getTags.length > 0) {
        parsePage(0, undefined).then(list => {
            insertPlayers(getTags, list);
            console.log("Done");
        });
    }

}

module.exports = { crawler };