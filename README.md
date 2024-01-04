# UltimateFightARR

An ARR integration that downloads UFC fights. This only does UFC, nothing else. All options
must be specified in a .env file in the main directory. An example is below:

```env
PROWLARR_KEY=someProwlarrAPIKey
PROWLARR_BASE_URL=http://localhost:9696
CHECK_LAST_N_DAYS=90
GET_PRELIMS=false
GET_COUNTDOWN=false
GET_FIGHT_NIGHT=false
GET_ON_ESPN=false
DOWNLOAD_DIRECTORY=H:\UFC
QBIT_API_USERNAME=admin
QBIT_API_PASS=password
QBIT_API_PORT=8080
```

Prerequisits:

 - QBittorrent or a compatible torrenting client. Feel free to create a PR if you
want to add another torrenting client but I probably won't do it. The relevant file
to modify is /src/Utilities/AddDownload.ts
 - ProwlARR, populated with indexers. Check out https://wiki.servarr.com/ if you want more
info on how to set this up. This will always be a requirement.
 - NodeJS v18+ and npm

How to setup:

1) Clone the repo to a folder on your computer. Do not use the same location that you will store fights.
This can be done with any tool you like, but an easy way is to download off of github and extract the archive
2) Open command prompt and `cd` to wherever you put the source code. Should be something like
`C:/Users/Me/FightARR`.
3) type the command `npm install` and wait for it to complete
4) create a file name `.env` and put it in the `FightARR` folder.
5) copy the above template into the `.env` file and then adjust it so that it 
works for you.