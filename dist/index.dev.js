'use strict';

var dotenv = require('dotenv');

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

const indexerInfoByID = {};
async function getIndexerInfo(indexerID) {
    if (indexerInfoByID[indexerID]) {
        return { ...indexerInfoByID[indexerID] };
    }
    let response = await fetch(`${process.env.PROWLARR_BASE_URL}/api/v1/indexer/${indexerID}&apikey=${process.env.PROWLARR_KEY}`, {
        method: "GET",
        headers: {
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

async function findTorrents({ eventDate, eventName, eventNumber, acceptableQuality, maxSizeBytes, minSeeders, eventType: EventType = "main" }) {
    let response = await fetch(`${process.env.PROWLARR_BASE_URL}/api/v1/search?query=UFC+${eventNumber}&indexerIds=-2&type=search&apikey=${process.env.PROWLARR_KEY}`, {
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
        minSeeders
    }, results);
    sortTorrents(results);
    console.log("Best result: ");
    console.log(JSON.stringify(results[0] || {}));
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
        result.eventType = "main";
    });
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        result.indexerPriority = (await getIndexerInfo(result.indexerId)).priority;
    }
    return results;
}
function filterTorrents({ eventDate, eventName, eventNumber, acceptableQuality, maxSizeBytes, minSeeders }, results) {
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
    filterToIncludeString(eventNumber.toString());
    console.log(`found ${results.length} with correct event number`);
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
    return results;
}
function sortTorrents(results) {
    results.sort((a, b) => {
        if (a.indexerPriority !== b.indexerPriority) {
            return a.indexerPriority - b.indexerPriority;
        }
        return b.seeders - a.seeders;
    });
}

dotenv__namespace.config();
findTorrents({
    eventNumber: 251,
    acceptableQuality: ["1080"],
    maxSizeBytes: 8e9,
    minSeeders: 3,
    eventType: "main"
});
//# sourceMappingURL=index.dev.js.map
