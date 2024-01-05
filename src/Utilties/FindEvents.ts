import * as cheerio from 'cheerio';
import * as process from "process";
import {ExistingDownload, findExistingDownloads} from "./FindExistingDownloads";
import {EventType} from "./FindTorrents";

export type Event = {
    monitored: boolean,
    eventNumber: number,
    eventName: string,
    uid: string,
    fightNight: boolean,
    onABC: boolean,
    onESPN: boolean,
    eventType: EventType,
    resolution?: undefined,
    date: Date,
    eventURL: string,
    downloads: any[],
    lookForDownload: boolean,
}

export let allDownloads : ExistingDownload[] = [];

export let allEvents : Event[] = [];

export async function findEvents(){

    let newAllEvents = []

    let $ = cheerio.load(await (await fetch("https://en.wikipedia.org/wiki/List_of_UFC_events")).text());
    let tableOfEventsString = $('table#Past_events').toString();
    $ = cheerio.load(tableOfEventsString);
    let tableOfEvents = $('tbody');
    let tableData = tableOfEvents.find("tr").map(function (index){
        if(index === 0){
            return {};
        }
        try{
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const tableRow = $(this);
            let fightLink = undefined;
            let rowContents = [];
            tableRow.find("td").map(function (i){
                try{
                    if(i === 1){
                        fightLink = "https://en.wikipedia.org" + $(this).children("a").attr("href")
                    }
                }catch(e){
                    console.warn("No fight link found");
                }

                rowContents.push($(this).text().replace(/\n/g, ""));
                return $(this).text();
            });
            let fullName = rowContents[1].trim();
            let dateString = rowContents[2].trim();
            let fightNight = fullName.toLowerCase().includes("fight night")
            let onESPN = fullName.toLowerCase().includes("on espn")
            let fightNumber = undefined;
            if(!fightNight && !onESPN){
                fightNumber = fullName.match(/UFC \d+/)?.[0]?.match(/\d+/)?.[0]
                if(fightNumber){
                    fightNumber = parseInt(fightNumber);
                }
            }
            let normalizedEventName = fullName.normalize("NFD").replace(/[\u0300-\u036f.:]/g, "")
            let date = new Date(dateString);
            let monitored = Date.now() - date.valueOf() < 1000 * 60 * 60 * 24 * parseInt(process.env.CHECK_LAST_N_DAYS);
            if(onESPN && (process.env.GET_FIGHT_NIGHT === "false")){
                monitored = false;
            }
            if(fightNight && (process.env.GET_FIGHT_NIGHT === "false")){
                monitored = false;
            }
            normalizedEventName = normalizedEventName.replace("Fight Night", "")
            normalizedEventName = normalizedEventName.replace(/UFC \d+/, "")
            normalizedEventName = normalizedEventName.replace("UFC", "")
            normalizedEventName = normalizedEventName.replace("on ESPN", "")
            normalizedEventName  = normalizedEventName.trim();
                newAllEvents.push({
                monitored: monitored,
                eventNumber: fightNumber,
                eventName: normalizedEventName,
                uid: rowContents[0],
                fightNight: fightNight,
                onESPN: onESPN,
                eventType: "main",
                resolution: undefined,
                date: date,
                eventURL: fightLink,
                downloads: [],
                lookForDownload: false,
            })
            // return {
            //     number: rowContents[0],
            //     fightNight: fightNight,
            //     eventType: "main",
            //     resolution: undefined,
            //     eventNumber: fightNumber,
            //     eventName: normalizedEventName,
            //     date: dateString,};
        }catch(e){
            console.warn("Error parsing table row");
        }
    })

    allEvents = newAllEvents;
    console.log(newAllEvents);
}

export function markExistingDownloads(existingDownloads){
    existingDownloads.forEach((existingDownload)=>{
        let currentHighScore = 0;
        let currentChamp = undefined;
        allEvents.forEach((knownEvent)=> {
            let matchPoints = 0;
            if(
                knownEvent.date && existingDownload.date &&
                Math.abs(knownEvent.date.valueOf() - existingDownload.date.valueOf()) < 1000 * 60 * 60 * 5
            ){
                matchPoints += 10;
            }
            else if(
                knownEvent.date && existingDownload.date &&
                Math.abs(knownEvent.date.valueOf() - existingDownload.date.valueOf()) > 1000 * 60 * 60 * 48){

                matchPoints -= 5;
            }
            if(
                knownEvent.date && existingDownload.date &&
                Math.abs(knownEvent.date.valueOf() - existingDownload.date.valueOf()) > 1000 * 60 * 60 * 24 * 10){

                matchPoints -= 20;
            }
            if(knownEvent.fightNight !== existingDownload.fightNight){
                matchPoints -= 15;
            }
            if(knownEvent.onESPN !== existingDownload.onESPN){
                matchPoints -= 15;
            }
            if(knownEvent.eventNumber && existingDownload.eventNumber && knownEvent.eventNumber === existingDownload.eventNumber){
                matchPoints += 10;
            }
            if(knownEvent.eventName === existingDownload.eventName ){
                matchPoints += 20;
            }
            if(matchPoints > currentHighScore){
                currentChamp = knownEvent;
            }
        })
        if(currentChamp){
            currentChamp.downloads.push(existingDownload);
            existingDownload.matchingEvent = currentChamp;
        }
    })

    allEvents.forEach((knownEvent)=> {
        if(knownEvent && knownEvent.monitored ){
            let mainEventMissing : boolean = !knownEvent.downloads.some((d)=>{
                return d.eventType === "main"
            })
            let prelimMissing : boolean = !knownEvent.downloads.some((d)=>{
                return d.eventType === "prelims"
            }) && Boolean(process.env.GET_PRELIMS === "true")
            let countdownMissing  : boolean= !knownEvent.downloads.some((d)=>{
                return d.eventType === "countdown"
            }) && (process.env.GET_COUNTDOWN === "true")

            knownEvent.lookForDownload = mainEventMissing || prelimMissing || countdownMissing;
        }
    })
}

export async function loadEvents(){
    let existingDownloads = findExistingDownloads(process.env.DOWNLOAD_DIRECTORY);
    allDownloads = existingDownloads;
    await findEvents();
    markExistingDownloads(existingDownloads);
}