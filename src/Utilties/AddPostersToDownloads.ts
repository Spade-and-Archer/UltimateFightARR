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
    for(let i = 0; i < posterPaths.length; i++){
        await addPosterAtPath(download, posterPaths[i], posterURL).catch((e)=>{
            console.warn("error downloading poster")
            console.warn(e);
        })
        await sleep(1000);
    }
    await sleep(10000);
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
    if(!path.endsWith("\\")){
        path = path + "\\";
    }
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

let sempaphor = false;
export async function downloadAsync(url, dest){
    return download(url, dest, ()=>true);
}
let download = function (url, filepath, cb) {
    return new Promise((resolve, reject) => {
        https.get(
            url,
            {
                headers: {
                    'User-Agent':  "UltimateFightARR/0.0 (https://github.com/Spade-and-Archer/UltimateFightARR; andy.tewfik@gmail.com) NodeHTTPS",
                },
        }, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
};
