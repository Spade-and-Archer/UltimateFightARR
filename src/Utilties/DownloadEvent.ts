import {EventType, findTorrents} from "./FindTorrents";
import {generateFileNameFromEventInfo} from "./FindExistingDownloads";
import {Event} from "./FindEvents";
import * as fs from "fs";
import {AddDownload} from "./AddDownload";
export async function downloadEvent(event: Event, eventType: EventType="main"){
    let torrents = await findTorrents({
        eventDate: event.date,
        eventName: event.eventName,
        fightNight: event.fightNight,
        eventNumber: event.eventNumber,
        acceptableQuality: ["1080p"],
        maxSizeBytes: 11e9,
        minSeeders: 2,
        eventType: eventType
    });
    if(torrents.length > 0){
        let bestResult = torrents[0];
        let name = generateFileNameFromEventInfo(event, eventType)
        let savePath = `${process.env.DOWNLOAD_DIRECTORY}\\${name}\\`
        if (!fs.existsSync(savePath)){
            fs.mkdirSync(savePath);
        }
        await AddDownload(
            bestResult.downloadUrl,
            savePath,
            name
        )
    }


}