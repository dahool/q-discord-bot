import { safeNull } from "@/common/utils";
import { environment } from "@/env/environment";
import { logger } from "@/logging/logger";
import { BotConfigModel, PlayerInfoModel } from "@/repository/model.schemas";
import axios from 'axios';
import { DateTime } from "luxon";

function parsePlayer(data: any[], index: number, version: number): any {
    const header = data[index];
    return {
        name: data[header.owner],
        level: data[header.level],
        tag: safeNull(data[header.alliance_tag]).toUpperCase(),
        power: data[header.score],
        pd: data[header.pd],
        rss: data[header.rss],
        version: version
    }
}

function parseList(data: any[], version: number): any[] {
    let players = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i] != undefined && typeof data[i] === 'object' && 'owner' in data[i]) {
            try {
                players.push(parsePlayer(data, i, version));    
            } catch (error) {
                logger.error("Error processing %O: %O", data[i], error);
                console.error(error);
            }
        }
    }
    return players;
}

function parsePage(pageNumber: number, totalPages: number | undefined, version: number): Promise<any[]> {
    if (totalPages == undefined || (totalPages != undefined && pageNumber <= totalPages)) {
        return new Promise((resolv, reject) => {
            logger.debug("Requesting page %s%s", environment.playerInfoURL, pageNumber);
            axios.get(environment.playerInfoURL + pageNumber)
                .then(res => {
                    const data = res.data.nodes[1].data;
                    if (pageNumber == 0) {
                        const totalItems = data[1];
                        const itemsPerPage = data[2];
                        totalPages = Math.ceil(totalItems / itemsPerPage);
                    }
                    let list = parseList(data, version);
                    parsePage(++pageNumber, totalPages, version).then((r: any) => {
                        resolv(list.concat(r));
                    });
                })
                .catch(err => {
                    logger.error('Error: %s', err.message);
                    reject(err.message);
                });
        })
    }
    return new Promise(resolv => {
        resolv([]);
    });
}

async function insertAllPlayers(list: any[], version: number): Promise<any> {
    if (list.length) {
        logger.debug("Insert %d players", list.length);
        await PlayerInfoModel.deleteMany({version: version}).exec();
        let botConfig = await BotConfigModel.findOne().exec();
        if (botConfig == null) {
            botConfig = new BotConfigModel();
        }
        botConfig.playerInfoVersion = version;
        botConfig.save();
        return PlayerInfoModel.insertMany(list);
    }
    return Promise.resolve();
}

export async function executeCrawler(): Promise<any> {
    const version = parseInt(DateTime.now().toFormat('yyyyMMdd'));
    const playersList = await parsePage(0, undefined, version);
    return insertAllPlayers(playersList, version);
}
