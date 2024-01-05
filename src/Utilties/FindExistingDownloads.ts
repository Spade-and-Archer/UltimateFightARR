import * as fs from "fs";
import {Event} from "./FindEvents";
import {EventType} from "./FindTorrents";
// UFC 251 (prelim | earlyPrelim | main) 1080p Edwards vs Covington
// UFC FN (prelim | earlyPrelim | main) 1080p Edwards vs Covington

export type ExistingDownload = {
    fightNight: boolean,
    onESPN: boolean,
    onABC: boolean,
    eventType: EventType,
    resolution: string,
    eventNumber?: number ,
    eventName: string,
    date: Date,
    matchingEvent: Event,
    folderPath?: string,
}
export function findExistingDownloads(directory) : ExistingDownload[]{
    let folders = fs.readdirSync(directory);
    let downloadedEvents = folders.map((folderName)=>{
        return getEventInfoFromFileName(folderName, directory);
    })
    downloadedEvents = downloadedEvents.filter((de)=>{
        return de !== undefined;
    })
    return downloadedEvents;
}

export function getEventInfoFromFileName(folderName, directory) : ExistingDownload {
    try{
        let regex = /UFC ([\d]+|FN|ESPN|ABC) (\w+) (\d+[ikp]) (\d+) (\d+) (\d+) (.*)/;
        let [, eventNumber, eventType, resolution, day, month, year, name] = folderName.match(regex);
        let dateOfEvent = new Date(year, month - 1, day);
        let ppvEvent = false;
        try{
            let parsedEventNumber = parseInt(eventNumber, 10);
            if(!isNaN(parsedEventNumber)){
                ppvEvent = true;
                eventNumber = parsedEventNumber;
            }

        }catch(e){
            console.warn("error parsing fight number in folder name");
            console.warn(e);
        }
        return {
            fightNight: eventNumber === "FN",
            onESPN: eventNumber === "ESPN",
            onABC: eventNumber === "ABC",
            eventType: eventType,
            resolution: resolution,
            eventNumber: ppvEvent ? eventNumber : undefined ,
            eventName: name,
            date: dateOfEvent,
            matchingEvent: undefined,
            folderPath: `${directory}\\${folderName}`
        }
    }catch(e){
        console.warn(e);
        console.warn(`Failed to parse file name ${folderName} could not find matching UFC event`)
        return undefined;
    }


}

export function generateFileNameFromEventInfo(event: Event, eventType: EventType="main", qualityString="1080p"){
    let string = `UFC`;
    if(event.fightNight){
        string += " FN"
    }
    else if(event.onESPN){
        string += " ESPN"
    }
    else if(event.onABC){
        string += " ABC"
    }
    else{
        string += ` ${event.eventNumber}`
    }
    string += ` ${eventType}`
    string += ` ${qualityString}`
    string += ` ${event.date.getDate()} ${event.date.getMonth() + 1} ${event.date.getFullYear()}`
    string += ` ${event.eventName}`

    return string
}
