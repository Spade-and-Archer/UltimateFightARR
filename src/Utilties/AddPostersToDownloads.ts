import {ExistingDownload} from "./FindExistingDownloads";
import {Event} from "./FindEvents";
import * as fs from "fs";
import https from 'https';
import * as cheerio from 'cheerio';
export async function addPosterToDownload(download : ExistingDownload){
    let posterPaths = [`${download.folderPath}\\`]
    let directories = getDirectories(download.folderPath);
    directories.forEach((dir)=>{
        posterPaths.push(`${download.folderPath}\\${dir}`);
    })
    let posterNeedsDownloading = posterPaths.some((path)=>isPosterNeededAtPath(path));
    if(!posterNeedsDownloading){
        return;
    }

    let posterURL = await getPosterLinkForEvent(download.matchingEvent);
    if(!posterURL){
        console.warn("Failed to find poster")
        return;
    }
    let promises = [];
    posterPaths.forEach((path)=>{
        promises.push(addPosterAtPath(download, path, posterURL))

    })
    await Promise.allSettled(promises);
    await sleep(3000);
}
export async function sleep(millis: number): Promise<void> {
    await timeout(millis);
}
export function timeout(millis: number): Promise<void> {
    return new Promise(function (resolve) {
        setTimeout(resolve, millis);
    });
}
export function isPosterNeededAtPath(path){
    let allFiles = getFiles(path);
    
    return !allFiles.some((file)=>{return file.includes("poster")})
    // if there is already a poster file in the directory
}
export async function addPosterAtPath(download: ExistingDownload, path: string, posterURL){
    //return if no poster needed
    if(!isPosterNeededAtPath(path)){
        return;
    }
    let posterFileExtension = /(?:\.([^.]+))?$/.exec(posterURL)[1];

    await downloadAsync(posterURL, `${path}poster.${posterFileExtension}`);
}

export async function getPosterLinkForEvent(event : Event){
    let wikiURL = event.eventURL;
    let $ = cheerio.load(await (await fetch(wikiURL)).text());
    let poster = $('#mw-content-text .infobox tbody tr:nth-child(2) .infobox-image .mw-file-description > img:nth-child(1)')
    let href = poster.attr("src");
    if(!href){
        return null;
    }
    let posterURL = "https:" + poster.attr("src");
    return posterURL;
}

const getDirectories = source =>
    fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
const getFiles = source =>
    fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => !dirent.isDirectory())
        .map(dirent => dirent.name)

async function downloadAsync(url, dest){
    return new Promise((resolve, reject) => {
        download(url, dest, (err, script) => {
            if (err) reject(err);
            else resolve(script);
        });
    });
}
let download = function (url, dest, cb) {
    let file = fs.createWriteStream(dest);
    let request = https
        .get(url, function (response) {
            response.pipe(file);
            file.on('finish', function () {
                file.close(cb);
            });
        })
        .on('error', function (err) {
            fs.unlink(dest,()=>true); // Delete the file async if there is an error
            if (cb) cb(err.message);
        });

    request.on('error', function (err) {
        console.log(err);
    });
};
