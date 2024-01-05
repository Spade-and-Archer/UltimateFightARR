import {allDownloads, allEvents, loadEvents} from "./Utilties/FindEvents";
import {findTorrents} from "./Utilties/FindTorrents";
import {downloadEvent} from "./Utilties/DownloadEvent";
import {addPosterToDownload, sleep} from "./Utilties/AddPostersToDownloads";

export async function DownloadAllMonitoredEvents(){
    await loadEvents();
    let eventsPendingDownload = allEvents.filter((e)=>{
        return e.lookForDownload
    });
    let areDownloads = false;
    for(let i =0; i < eventsPendingDownload.length; i++){
        let event = eventsPendingDownload[i];
        if(!event.downloads.some((d)=>{
            return d.eventType === "main"
        })){
            await downloadEvent(event, "main");
            areDownloads = true;
        }
    }

    if(areDownloads){
        // waiting for torrent client to populate folders
        console.log("waiting 5 seconds for torrent client to populate folder structure");
        await sleep(5000)
        await loadEvents();
    }
    for(let i = 0; i < allDownloads.length; i++){
        await addPosterToDownload(allDownloads[i]);
    }

}