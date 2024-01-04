import {allDownloads, allEvents, loadEvents} from "./Utilties/FindEvents";
import {findTorrents} from "./Utilties/FindTorrents";
import {downloadEvent} from "./Utilties/DownloadEvent";
import {addPosterToDownload} from "./Utilties/AddPostersToDownloads";

export async function DownloadAllMonitoredEvents(){
    await loadEvents();
    let eventsPendingDownload = allEvents.filter((e)=>{
        return e.lookForDownload
    });

    for(let i =0; i < eventsPendingDownload.length; i++){
        let event = eventsPendingDownload[i];
        if(!event.downloads.some((d)=>{
            return d.eventType === "main"
        })){
            await downloadEvent(event, "main");
        }
    }
    for(let i = 0; i < allDownloads.length; i++){
        await addPosterToDownload(allDownloads[i]);
    }

}