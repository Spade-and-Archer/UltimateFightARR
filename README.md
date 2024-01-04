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
3) Type the command `npm install` and wait for it to complete
4) Create a file name `.env` and put it in the `FightARR` folder.
5) Copy the above template into the `.env` file and then adjust it so that it 
works for you (e.g. fill in your API key for ProwlARR)
6) Double check that .env file, make sure the downloads are going into the right place
and that you have selected how many days back you want to look for fights and what kinds
of fights you want.
7) Run the command `npm run start` This will begin the process of looking for fights and downloading them

Set up a task in windows task scheduler or another program to automatically run that command
in the source directory every day or every few days or whatever to stay up to date.

Some notes:

 - this uses wikipedia as a data source. So if wikipedia goes out of date on the fights,
this tool will start to lag. I know that's insane, but it is genuinely the best source of data for this
 - This tool will not allow imports. If you already have a collection of 100 fights it's probably best that you
just set up plex or Kodi or whatever to look in both your original folder and a new folder for this program.
 - This tool determines what fights have been downloaded based on what folders have been created in it's download
directory. An empty folder still counts. So do with that knowledge what you will.
 - This tool does not have robust tools to retry downloads. If it downloads the wrong thing once and you
delete the folder and tell it to try again, it will probably just try to download the exact same thing
again.


Ways to improve

- I want to add a UI

- I want to think about adding support for other fighting sports

- I want to add better handling of problem downloads, detecting that a download has failed and trying again with 
another torrent.