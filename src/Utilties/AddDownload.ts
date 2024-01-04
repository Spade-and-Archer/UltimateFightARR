import { qBittorrentClient } from '@robertklep/qbittorrent';
import * as process from "process";
let client = undefined;

export async function loginToQBit(){
    if(!client){
        client = new qBittorrentClient(
            `http://localhost:${process.env.QBIT_API_PORT}`,
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
export async function AddDownload(downloadURL, downloadPath){
    await loginToQBit()

    await client.torrents.add({
        urls: downloadURL,
        savepath: downloadPath,
        category: "UFC",
        root_folder: "false",
    })
}