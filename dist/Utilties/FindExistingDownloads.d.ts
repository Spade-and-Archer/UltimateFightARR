import { Event } from "./FindEvents";
import { EventType } from "./FindTorrents";
export type ExistingDownload = {
    fightNight: boolean;
    onESPN: boolean;
    onABC: boolean;
    eventType: EventType;
    resolution: string;
    eventNumber?: number;
    eventName: string;
    date: Date;
    matchingEvent: Event;
    folderPath?: string;
};
export declare function findExistingDownloads(directory: any): ExistingDownload[];
export declare function getEventInfoFromFileName(folderName: any, directory: any): ExistingDownload;
export declare function generateFileNameFromEventInfo(event: Event, eventType?: EventType, qualityString?: string): string;
