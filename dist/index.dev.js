'use strict';

var dotenv = require('dotenv');
var cheerio = require('cheerio');
var process$1 = require('process');
var fs = require('fs');
var qbittorrent = require('@robertklep/qbittorrent');
var https = require('https');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var dotenv__namespace = /*#__PURE__*/_interopNamespaceDefault(dotenv);
var cheerio__namespace = /*#__PURE__*/_interopNamespaceDefault(cheerio);
var process__namespace = /*#__PURE__*/_interopNamespaceDefault(process$1);
var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);

function findExistingDownloads(directory) {
    let folders = fs__namespace.readdirSync(directory);
    let downloadedEvents = folders.map((folderName) => {
        return getEventInfoFromFileName(folderName, directory);
    });
    downloadedEvents = downloadedEvents.filter((de) => {
        return de !== undefined;
    });
    return downloadedEvents;
}
function getEventInfoFromFileName(folderName, directory) {
    try {
        let regex = /UFC ([\d]+|FN|ESPN) (\w+) (\d+[ikp]) (\d+) (\d+) (\d+) (.*)/;
        let [, eventNumber, eventType, resolution, day, month, year, name] = folderName.match(regex);
        let dateOfEvent = new Date(year, month - 1, day);
        let ppvEvent = false;
        try {
            let parsedEventNumber = parseInt(eventNumber, 10);
            if (!isNaN(parsedEventNumber)) {
                ppvEvent = true;
                eventNumber = parsedEventNumber;
            }
        }
        catch (e) {
            console.warn("error parsing fight number in folder name");
            console.warn(e);
        }
        return {
            fightNight: eventNumber === "FN",
            onESPN: eventNumber === "ESPN",
            eventType: eventType,
            resolution: resolution,
            eventNumber: ppvEvent ? eventNumber : undefined,
            eventName: name,
            date: dateOfEvent,
            matchingEvent: undefined,
            folderPath: `${directory}\\${folderName}`
        };
    }
    catch (e) {
        console.warn(e);
        console.warn(`Failed to parse file name ${folderName} could not find matching UFC event`);
        return undefined;
    }
}
function generateFileNameFromEventInfo(event, eventType = "main", qualityString = "1080p") {
    let string = `UFC`;
    if (event.fightNight) {
        string += " FN";
    }
    else if (event.onESPN) {
        string += " ESPN";
    }
    else {
        string += ` ${event.eventNumber}`;
    }
    string += ` ${eventType}`;
    string += ` ${qualityString}`;
    string += ` ${event.date.getDate()} ${event.date.getMonth() + 1} ${event.date.getFullYear()}`;
    string += ` ${event.eventName}`;
    return string;
}

let allDownloads = [];
let allEvents = [];
async function findEvents() {
    let newAllEvents = [];
    let $ = cheerio__namespace.load(await (await fetch("https://en.wikipedia.org/wiki/List_of_UFC_events")).text());
    let tableOfEventsString = $('table#Past_events').toString();
    $ = cheerio__namespace.load(tableOfEventsString);
    let tableOfEvents = $('tbody');
    tableOfEvents.find("tr").map(function (index) {
        if (index === 0) {
            return {};
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const tableRow = $(this);
            let fightLink = undefined;
            let rowContents = [];
            tableRow.find("td").map(function (i) {
                try {
                    if (i === 1) {
                        fightLink = "https://en.wikipedia.org" + $(this).children("a").attr("href");
                    }
                }
                catch (e) {
                    console.warn("No fight link found");
                }
                rowContents.push($(this).text().replace(/\n/g, ""));
                return $(this).text();
            });
            let fullName = rowContents[1].trim();
            let dateString = rowContents[2].trim();
            let fightNight = fullName.toLowerCase().includes("fight night");
            let onESPN = fullName.toLowerCase().includes("on espn");
            let fightNumber = undefined;
            if (!fightNight && !onESPN) {
                fightNumber = fullName.match(/UFC \d+/)?.[0]?.match(/\d+/)?.[0];
                if (fightNumber) {
                    fightNumber = parseInt(fightNumber);
                }
            }
            let normalizedEventName = fullName.normalize("NFD").replace(/[\u0300-\u036f.:]/g, "");
            let date = new Date(dateString);
            let monitored = Date.now() - date.valueOf() < 1000 * 60 * 60 * 24 * parseInt(process__namespace.env.CHECK_LAST_N_DAYS);
            if (onESPN && (process__namespace.env.GET_FIGHT_NIGHT === "false")) {
                monitored = false;
            }
            if (fightNight && (process__namespace.env.GET_FIGHT_NIGHT === "false")) {
                monitored = false;
            }
            normalizedEventName = normalizedEventName.replace("Fight Night", "");
            normalizedEventName = normalizedEventName.replace(/UFC \d+/, "");
            normalizedEventName = normalizedEventName.replace("UFC", "");
            normalizedEventName = normalizedEventName.replace("on ESPN", "");
            normalizedEventName = normalizedEventName.trim();
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
            });
            // return {
            //     number: rowContents[0],
            //     fightNight: fightNight,
            //     eventType: "main",
            //     resolution: undefined,
            //     eventNumber: fightNumber,
            //     eventName: normalizedEventName,
            //     date: dateString,};
        }
        catch (e) {
            console.warn("Error parsing table row");
        }
    });
    allEvents = newAllEvents;
    console.log(newAllEvents);
}
function markExistingDownloads(existingDownloads) {
    existingDownloads.forEach((existingDownload) => {
        let currentHighScore = 0;
        let currentChamp = undefined;
        allEvents.forEach((knownEvent) => {
            let matchPoints = 0;
            if (knownEvent.date && existingDownload.date &&
                Math.abs(knownEvent.date.valueOf() - existingDownload.date.valueOf()) < 1000 * 60 * 60 * 5) {
                matchPoints += 10;
            }
            else if (knownEvent.date && existingDownload.date &&
                Math.abs(knownEvent.date.valueOf() - existingDownload.date.valueOf()) > 1000 * 60 * 60 * 48) {
                matchPoints -= 5;
            }
            if (knownEvent.date && existingDownload.date &&
                Math.abs(knownEvent.date.valueOf() - existingDownload.date.valueOf()) > 1000 * 60 * 60 * 24 * 10) {
                matchPoints -= 20;
            }
            if (knownEvent.fightNight !== existingDownload.fightNight) {
                matchPoints -= 15;
            }
            if (knownEvent.onESPN !== existingDownload.onESPN) {
                matchPoints -= 15;
            }
            if (knownEvent.eventNumber && existingDownload.eventNumber && knownEvent.eventNumber === existingDownload.eventNumber) {
                matchPoints += 10;
            }
            if (knownEvent.eventName === existingDownload.eventName) {
                matchPoints += 20;
            }
            if (matchPoints > currentHighScore) {
                currentChamp = knownEvent;
            }
        });
        if (currentChamp) {
            currentChamp.downloads.push(existingDownload);
            existingDownload.matchingEvent = currentChamp;
        }
    });
    allEvents.forEach((knownEvent) => {
        if (knownEvent && knownEvent.monitored) {
            let mainEventMissing = !knownEvent.downloads.some((d) => {
                return d.eventType === "main";
            });
            let prelimMissing = !knownEvent.downloads.some((d) => {
                return d.eventType === "prelims";
            }) && Boolean(process__namespace.env.GET_PRELIMS === "true");
            let countdownMissing = !knownEvent.downloads.some((d) => {
                return d.eventType === "countdown";
            }) && (process__namespace.env.GET_COUNTDOWN === "true");
            knownEvent.lookForDownload = mainEventMissing || prelimMissing || countdownMissing;
        }
    });
}
async function loadEvents() {
    let existingDownloads = findExistingDownloads(process__namespace.env.DOWNLOAD_DIRECTORY);
    allDownloads = existingDownloads;
    await findEvents();
    markExistingDownloads(existingDownloads);
}

const indexerInfoByID = {};
async function getIndexerInfo(indexerID) {
    if (indexerInfoByID[indexerID]) {
        return { ...indexerInfoByID[indexerID] };
    }
    let response = await fetch(`${process.env.PROWLARR_BASE_URL}/api/v1/indexer/${indexerID}`, {
        method: "GET",
        headers: {
            "X-Api-Key": process.env.PROWLARR_KEY,
            "Content-Type": "application/json",
        },
    });
    try {
        if (response.status === 200) {
            indexerInfoByID[indexerID] = await response.json();
            return { ...indexerInfoByID[indexerID] };
        }
    }
    catch (e) {
        console.warn("error parsing indexer info from prowlarr.");
        console.warn(e);
        throw new Error("Error parsing indexer info from prowlarr.");
    }
    console.warn(`Error: Prowlarr responded to indexer info request with ${response.status}`);
    throw new Error(`Error: Prowlarr responded to indexer info request with ${response.status}`);
}

async function findTorrents({ eventDate, eventName, fightNight = false, eventNumber, acceptableQuality, maxSizeBytes, minSeeders, eventType = "main" }) {
    let query = "UFC";
    if (fightNight) {
        query += `+Fight+Night`;
    }
    if (eventNumber) {
        query += `+${eventNumber}`;
    }
    if (eventName) {
        query += `+${eventName}`;
    }
    console.log(`Query is ${query}`);
    let response = await fetch(`${process.env.PROWLARR_BASE_URL}/api/v1/search?query=${query}&indexerIds=-2&type=search&apikey=${process.env.PROWLARR_KEY}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (response.status !== 200) {
        console.warn("Error: Could not reach Prowlarr");
        console.warn(`Could not send fetch request, failed with status ${response.status}`);
        try {
            let body = response.text();
            console.warn(`Response: ${body}`);
        }
        catch (e) {
            console.warn(`Response had no body`);
        }
        console.warn(`Giving up finding torrent`);
        return;
    }
    let results = [];
    try {
        results = await response.json();
    }
    catch (e) {
        console.warn(`Response from prowlarr invalid`);
        console.warn(e);
        try {
            let body = response.text();
            console.warn(`Response: ${body}`);
        }
        catch (e) {
            console.warn(`Response had no body`);
        }
    }
    console.log(`found ${results.length} results total`);
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
    console.log("Best result: ");
    console.log(JSON.stringify(results[0] || {}));
    return results;
}
async function populateResultMetadata(results) {
    results.forEach((result) => {
        if (["early prelims", "early preliminaries", " early",].some((actualText) => {
            return result.title.toLowerCase().includes(actualText.toLowerCase()) || result.sortTitle.toLowerCase().includes(actualText);
        })) {
            result.eventType = "earlyPrelims";
            return;
        }
        if (["prelims", "preliminaries", "preliminary",].some((actualText) => {
            return result.title.toLowerCase().includes(actualText.toLowerCase()) || result.sortTitle.toLowerCase().includes(actualText);
        })) {
            result.eventType = "prelims";
            return;
        }
        if ([" countdown "].some((actualText) => {
            return result.title.toLowerCase().includes(actualText.toLowerCase()) || result.sortTitle.toLowerCase().includes(actualText);
        })) {
            result.eventType = "countdown";
            return;
        }
        result.eventType = "main";
    });
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        result.indexerPriority = (await getIndexerInfo(result.indexerId)).priority;
    }
    return results;
}
function filterTorrents({ eventDate, eventName, eventNumber, acceptableQuality, maxSizeBytes, minSeeders, eventType, }, results) {
    let filterToIncludeString = (textToInclude) => {
        // allow a single string to work as text to inlcude, or an array of strings
        if (!Array.isArray(textToInclude)) {
            textToInclude = [textToInclude];
        }
        if (Array.isArray(textToInclude)) {
            results = results.filter((result) => {
                return textToInclude.some((actualText) => {
                    return result.title.toLowerCase().includes(actualText.toLowerCase()) || result.sortTitle.toLowerCase().includes(actualText);
                });
            });
            return;
        }
    };
    filterToIncludeString("UFC");
    console.log(`found ${results.length} with UFC in title`);
    if (eventNumber) {
        filterToIncludeString(eventNumber.toString());
        console.log(`found ${results.length} with correct event number`);
    }
    if (eventName) {
        eventName = eventName.normalize("NFD").replace(/[\u0300-\u036f.:]/g, "");
        eventName = eventName.replace(" vs ", " ");
        let eventNamesList = eventName.split(" ");
        eventNamesList.forEach((eventName) => {
            filterToIncludeString(eventName.toString());
        });
        console.log(`found ${results.length} with correct event name`);
    }
    if (acceptableQuality) {
        filterToIncludeString(acceptableQuality);
        console.log(`found ${results.length} with Acceptable Quality`);
    }
    if (minSeeders) {
        results = results.filter((result) => {
            return result.seeders > minSeeders;
        });
        console.log(`found ${results.length} with more than ${minSeeders} seeders`);
    }
    if (maxSizeBytes) {
        results = results.filter((result) => {
            return result.size < maxSizeBytes;
        });
        console.log(`found ${results.length} smaller than ${Math.round(maxSizeBytes / 1e9 * 100) / 100} GB`);
    }
    //filter out multi-part torrents
    results = results.filter((result) => {
        return !result.sortTitle.match(/part [\d]/);
    });
    console.log(`found ${results.length} results that aren't multi-part`);
    //filter out multi-part torrents
    results = results.filter((result) => {
        return result.eventType === eventType;
    });
    console.log(`found ${results.length} results that are the correct event type`);
    return results;
}
function sortTorrents(results) {
    results.sort((a, b) => {
        if (a.indexerPriority !== b.indexerPriority) {
            return a.indexerPriority - b.indexerPriority;
        }
        return b.seeders - a.seeders;
    });
    return results;
}

let client = undefined;
async function loginToQBit() {
    if (!client) {
        client = new qbittorrent.qBittorrentClient(`http://localhost:${process__namespace.env.QBIT_API_PORT}`, process__namespace.env.QBIT_API_USERNAME, process__namespace.env.QBIT_API_PASS);
        await client.auth.login(process__namespace.env.QBIT_API_USERNAME, process__namespace.env.QBIT_API_PASS);
        await client.app.version();
    }
}
async function AddDownload(downloadURL, downloadPath, name = undefined) {
    await loginToQBit();
    let options = {
        urls: downloadURL,
        savepath: downloadPath,
        category: "UFC",
        root_folder: "false",
    };
    if (name) {
        options.rename = name;
    }
    await client.torrents.add(options);
}

async function downloadEvent(event, eventType = "main") {
    let torrents = await findTorrents({
        eventDate: event.date,
        eventName: event.eventName,
        fightNight: event.fightNight,
        eventNumber: event.eventNumber,
        acceptableQuality: ["1080p"],
        maxSizeBytes: 11e9,
        minSeeders: 2,
        eventType: eventType
    });
    if (torrents.length > 0) {
        let bestResult = torrents[0];
        let name = generateFileNameFromEventInfo(event, eventType);
        let savePath = `${process.env.DOWNLOAD_DIRECTORY}\\${name}\\`;
        if (!fs__namespace.existsSync(savePath)) {
            fs__namespace.mkdirSync(savePath);
        }
        await AddDownload(bestResult.downloadUrl, savePath, name);
    }
}

async function addPosterToDownload(download) {
    let posterPaths = [`${download.folderPath}\\`];
    let directories = getDirectories(download.folderPath);
    directories.forEach((dir) => {
        posterPaths.push(`${download.folderPath}\\${dir}`);
    });
    let posterNeedsDownloading = posterPaths.some((path) => isPosterNeededAtPath(path));
    if (!posterNeedsDownloading) {
        return;
    }
    let posterURL = await getPosterLinkForEvent(download.matchingEvent);
    if (!posterURL) {
        console.warn("Failed to find poster");
        return;
    }
    for (let i = 0; i < posterPaths.length; i++) {
        await addPosterAtPath(download, posterPaths[i], posterURL).catch((e) => {
            console.warn("error downloading poster");
            console.warn(e);
        });
        await sleep(1000);
    }
    await sleep(10000);
}
async function sleep(millis) {
    await timeout(millis);
}
function timeout(millis) {
    return new Promise(function (resolve) {
        setTimeout(resolve, millis);
    });
}
function isPosterNeededAtPath(path) {
    let allFiles = getFiles(path);
    return !allFiles.some((file) => { return file.includes("poster"); });
    // if there is already a poster file in the directory
}
async function addPosterAtPath(download, path, posterURL) {
    //return if no poster needed
    if (!isPosterNeededAtPath(path)) {
        return;
    }
    let posterFileExtension = /(?:\.([^.]+))?$/.exec(posterURL)[1];
    if (!path.endsWith("\\")) {
        path = path + "\\";
    }
    await downloadAsync(posterURL, `${path}poster.${posterFileExtension}`);
}
async function getPosterLinkForEvent(event) {
    let wikiURL = event.eventURL;
    let $ = cheerio__namespace.load(await (await fetch(wikiURL)).text());
    let poster = $('#mw-content-text .infobox tbody tr:nth-child(2) .infobox-image .mw-file-description > img:nth-child(1)');
    let href = poster.attr("src");
    if (!href) {
        return null;
    }
    let posterURL = "https:" + poster.attr("src");
    return posterURL;
}
const getDirectories = source => fs__namespace.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
const getFiles = source => fs__namespace.readdirSync(source, { withFileTypes: true })
    .filter(dirent => !dirent.isDirectory())
    .map(dirent => dirent.name);
async function downloadAsync(url, dest) {
    return download(url, dest);
}
let download = function (url, filepath, cb) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': "UltimateFightARR/0.0 (https://github.com/Spade-and-Archer/UltimateFightARR; andy.tewfik@gmail.com) NodeHTTPS",
            },
        }, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs__namespace.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            }
            else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
};

async function DownloadAllMonitoredEvents() {
    await loadEvents();
    let eventsPendingDownload = allEvents.filter((e) => {
        return e.lookForDownload;
    });
    let areDownloads = false;
    for (let i = 0; i < eventsPendingDownload.length; i++) {
        let event = eventsPendingDownload[i];
        if (!event.downloads.some((d) => {
            return d.eventType === "main";
        })) {
            await downloadEvent(event, "main");
            areDownloads = true;
        }
    }
    if (areDownloads) {
        await loadEvents();
    }
    for (let i = 0; i < allDownloads.length; i++) {
        await addPosterToDownload(allDownloads[i]);
    }
}

dotenv__namespace.config();
DownloadAllMonitoredEvents();
//# sourceMappingURL=index.dev.js.map
