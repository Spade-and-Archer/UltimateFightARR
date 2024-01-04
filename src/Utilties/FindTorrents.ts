
import {getIndexerInfo} from "./getIndexerInfo";
const indexerPriorityByID = {};
export type EventType =  ("prelims" | "main" | "earlyPrelims" | "countdown")
export type Result = {
    "guid": "https://1337x.to/torrent/5341563/UFC-277-Prelims-1080p-WEB-DL-H264-Fight-BB/",
    "age": 521,
    "ageHours": number,
    "ageMinutes": number,
    "size": number,
    "indexerId": number,
    "indexer": string,
    "title": string,
    "sortTitle": string,
    "imdbId": number,
    "tmdbId": number,
    "tvdbId": number,
    "tvMazeId": number,
    "publishDate": string,
    "downloadUrl": string,
    "infoUrl": string,
    "indexerFlags": string[],
    "categories": {
        "id": number,
        "name": string,
        "subCategories": string[]
    }[],
    "seeders": number,
    "leechers": number,
    "protocol": string,
    "fileName": string,
    "indexerPriority"?: number,
    "eventType"?: EventType
}

export async function findTorrents(
    {
        eventDate,
        eventName,
        fightNight = false,
        eventNumber,
        acceptableQuality,
        maxSizeBytes,
        minSeeders,
        eventType = "main"
   } : {
        eventDate? : Date,
        fightNight?: boolean,
        eventName? : string,
        eventNumber?  : number,
        acceptableQuality? : string[],
        maxSizeBytes? : number,
        minSeeders? : number,
        eventType?: EventType
    }
){
    let query = "UFC";
    if(fightNight){
        query += `+Fight+Night`;
    }
    if(eventNumber){
        query += `+${eventNumber}`;
    }
    if(eventName){
        query += `+${eventName}`;
    } console.log(`Query is ${query}`);
    let response = await fetch(
        `${process.env.PROWLARR_BASE_URL}/api/v1/search?query=${query}&indexerIds=-2&type=search&apikey=${process.env.PROWLARR_KEY}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    )
    if(response.status !== 200){
        console.warn("Error: Could not reach Prowlarr")
        console.warn(`Could not send fetch request, failed with status ${response.status}`)
        try{
            let body = response.text();
            console.warn(`Response: ${body}`)
        }
        catch(e){
            console.warn(`Response had no body`)
        }
        console.warn(`Giving up finding torrent`)
        return;
    }
    let results = [];
    try{
        results = await response.json();
    }
    catch(e){
        console.warn(`Response from prowlarr invalid`)
        console.warn(e)
        try{
            let body = response.text();
            console.warn(`Response: ${body}`)
        }
        catch(e){
            console.warn(`Response had no body`)
        }
    }

    console.log(`found ${results.length} results total`)


    results = await populateResultMetadata(results);

    results = filterTorrents({
        eventDate,
        eventName,
        eventNumber,
        acceptableQuality,
        maxSizeBytes,
        minSeeders,
        eventType,
    }, results);

    sortTorrents(results);

    console.log("Best result: ")
    console.log(JSON.stringify(results[0] || {}));
    return results;
}

export async function populateResultMetadata(results: Result[]){
    results.forEach((result)=>{
        if(["early prelims", "early preliminaries", " early",].some((actualText)=>{
            return result.title.toLowerCase().includes(actualText.toLowerCase()) || result.sortTitle.toLowerCase().includes(actualText);
        })
        ) {
            result.eventType = "earlyPrelims"
            return;
        }
        if(["prelims", "preliminaries", "preliminary",].some((actualText)=>{
            return result.title.toLowerCase().includes(actualText.toLowerCase()) || result.sortTitle.toLowerCase().includes(actualText);
        })
        ) {
            result.eventType = "prelims"
            return;
        }
        if([" countdown "].some((actualText)=>{
            return result.title.toLowerCase().includes(actualText.toLowerCase()) || result.sortTitle.toLowerCase().includes(actualText);
        })
        ) {
            result.eventType = "countdown"
            return;
        }
        result.eventType = "main";
    })

    for(let i = 0; i < results.length; i++){
        const result = results[i];
        result.indexerPriority = (await getIndexerInfo(result.indexerId)).priority;
    }

    return results;

}
export function filterTorrents(
    {
        eventDate,
        eventName,
        eventNumber,
        acceptableQuality,
        maxSizeBytes,
        minSeeders,
        eventType,
    },
    results : Result[]){

    let filterToIncludeString = (textToInclude)=>{
        // allow a single string to work as text to inlcude, or an array of strings
        if(!Array.isArray(textToInclude)){
            textToInclude = [textToInclude];
        }
        if(Array.isArray(textToInclude)){
            results = results.filter((result)=>{
                return textToInclude.some((actualText)=>{
                    return result.title.toLowerCase().includes(actualText.toLowerCase()) || result.sortTitle.toLowerCase().includes(actualText);
                })
            })
            return;
        }
    }
    filterToIncludeString("UFC");
    console.log(`found ${results.length} with UFC in title`)

    if(eventNumber){
        filterToIncludeString(eventNumber.toString());
        console.log(`found ${results.length} with correct event number`)
    }

    if(eventName){
        eventName = eventName.normalize("NFD").replace(/[\u0300-\u036f.:]/g, "")
        eventName = eventName.replace(" vs ", " ")
        let eventNamesList = eventName.split(" ");
        eventNamesList.forEach((eventName)=>{
            filterToIncludeString(eventName.toString());
        })
        console.log(`found ${results.length} with correct event name`);
    }

    if(acceptableQuality){
        filterToIncludeString(acceptableQuality);
        console.log(`found ${results.length} with Acceptable Quality`)
    }

    if(minSeeders){
        results = results.filter((result)=>{
            return result.seeders > minSeeders;
        })
        console.log(`found ${results.length} with more than ${minSeeders} seeders`)
    }

    if(maxSizeBytes){
        results = results.filter((result)=>{
            return result.size < maxSizeBytes;
        })
        console.log(`found ${results.length} smaller than ${Math.round(maxSizeBytes / 1e9 * 100) / 100} GB`)
    }

    //filter out multi-part torrents
    results = results.filter((result)=>{
        return !result.sortTitle.match(/part [\d]/)
    })
    console.log(`found ${results.length} results that aren't multi-part`)


    //filter out multi-part torrents
    results = results.filter((result)=>{
        return result.eventType === eventType;
    })
    console.log(`found ${results.length} results that are the correct event type`)

    return results;
}

export function sortTorrents(results : Result[]){
    results.sort((a, b)=>{
        if(a.indexerPriority !== b.indexerPriority){
            return a.indexerPriority - b.indexerPriority
        }
        return b.seeders - a.seeders;
    })
    return results;
}
