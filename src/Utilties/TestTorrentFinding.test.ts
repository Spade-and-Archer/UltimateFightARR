import {getIndexerInfo} from "./getIndexerInfo";
import {findTorrents} from "./FindTorrents";
import {findEvents} from "./FindEvents";
import {DownloadAllMonitoredEvents} from "../DownloadAllMonitoredEvents";
import {loginToQBit} from "./AddDownload";
import {getEventInfoFromFileName} from "./FindExistingDownloads";
import {downloadAsync} from "./AddPostersToDownloads";


jest.setTimeout(1000000);
describe("TestTorrentFinding tests", () => {
    jest.setTimeout(1000000);
    beforeAll(async () => {
        jest.setTimeout(1000000);
    });
    test("Find indexer info", async () => {
        await getIndexerInfo(1)
    });
    test("Search for torrent", async () => {
        const results = await findTorrents(
            {
                eventNumber: 251,
                acceptableQuality: ["1080"],
                maxSizeBytes: 8e9,
                minSeeders: 3,
                eventType : "main"
            }
        );
        console.log(results);
    });
    test("Search for torrent", async () => {
        const results = await findTorrents(
            {
                eventName: "UFC Fight Night: Song vs. Gutiérrez",
                fightNight: true,
                acceptableQuality: ["1080"],
                maxSizeBytes: 8e9,
                minSeeders: 3,
                eventType : "main"
            }
        );
        console.log(results);
    });
    test("Find all fights", async () => {
        const results = await findEvents();
        console.log(results);
    });
    test("get info from file name", async () => {
        let info = getEventInfoFromFileName("UFC 296 main 1080p 16 12 2023 Edwards vs Covington", process.env.DOWNLOAD_DIRECTORY);
        expect(info.eventNumber).toBe(296)
        expect(info.eventType).toBe("main")
        expect(info.date.getFullYear()).toBe(2023)
        expect(info.date.getDate()).toBe(16)
    });
    test("Test QBit connection", async () => {
        await loginToQBit();
    });

    test("Downlaod all", async () => {
        const results = await DownloadAllMonitoredEvents();
        console.log(results);
    });

    test("Downlaod one image", async () => {
        await downloadAsync(
            "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/UFC294poster.jpg/220px-UFC294poster.jpg",
            `H:\\UFC\\UFC 294 main 1080p 21 10 2023 Makhachev vs Volkanovski 2\\UFC.294.Makhachev.Vs.Volkanovski.2.1080p.HDTV.AAC.H264-Ali[TGx]\\poster.jpg`
        );
        await downloadAsync(
            "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/UFC294poster.jpg/220px-UFC294poster.jpg",
            `H:\\UFC\\UFC 294 main 1080p 21 10 2023 Makhachev vs Volkanovski 2\\poster.jpg`
        );
    });

});
