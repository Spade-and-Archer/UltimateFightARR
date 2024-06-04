import { qBittorrentClient } from '@robertklep/qbittorrent';
import * as process from "process";
let client = undefined;

export async function loginToQBit(){
    if(!client){
        client = new qBittorrentClient(
            process.env.QBIT_URL, //?? `http://localhost:${process.env.QBIT_API_PORT}`,
            process.env.QBIT_API_USERNAME,
            process.env.QBIT_API_PASS
        );
        await client.auth.login(
            process.env.QBIT_API_USERNAME,
            process.env.QBIT_API_PASS
        );
        await client.app.version();
    }

}
export async function AddDownload(downloadURL, downloadPath, name=undefined){
    await loginToQBit()
    let options: { savepath: any; urls: any; root_folder: string; category: string, rename?:string} = {
        urls: downloadURL,
        savepath: downloadPath,
        category: "UFC",
        root_folder: "false",
    }
    if(name){
        options.rename = name;
    }
    await client.torrents.add(options);
}