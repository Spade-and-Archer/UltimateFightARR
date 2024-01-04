import * as dotenv from "dotenv";
import {findTorrents} from "./Utilties/FindTorrents";
import {DownloadAllMonitoredEvents} from "./DownloadAllMonitoredEvents";

dotenv.config();

DownloadAllMonitoredEvents();