import { EventType } from "./FindTorrents";
import { Event } from "./FindEvents";
export declare function downloadEvent(event: Event, eventType?: EventType): Promise<void>;
