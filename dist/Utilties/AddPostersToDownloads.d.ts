import { ExistingDownload } from "./FindExistingDownloads";
import { Event } from "./FindEvents";
export declare function addPosterToDownload(download: ExistingDownload): Promise<void>;
export declare function sleep(millis: number): Promise<void>;
export declare function timeout(millis: number): Promise<void>;
export declare function isPosterNeededAtPath(path: any): boolean;
export declare function addPosterAtPath(download: ExistingDownload, path: string, posterURL: any): Promise<void>;
export declare function getPosterLinkForEvent(event: Event): Promise<string>;
