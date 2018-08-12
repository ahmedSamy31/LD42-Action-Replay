//replayapi.js

let SERVER_URL = "http://46.101.67.219:8082";
let DEBUG = true;
let DEBUG_REPLAY = null;

class ReplayAPI {
    static UploadLevelReplay(replayInfo, callback) {
        let str = JSON.stringify(replayInfo)
        DEBUG_REPLAY = JSON.parse(str);
        let xml = new XMLHttpRequest();
        xml.open("POST", SERVER_URL+"/upload");
        xml.responseType = "json";
        xml.onload = () => {
            callback(xml.response);
        }
        xml.onerror = () => {
            callback(null);
        }
        xml.send(str);
    }

    static GetLevelLeaderboard(levelID, callback) {
        let xml = new XMLHttpRequest();
        xml.open("GET", SERVER_URL+"/"+levelID+"/all.json");
        xml.responseType = "json";
        xml.onload = () => {
            callback(xml.response);
        }
        xml.onerror = () => {
            if (DEBUG) { 
                callback({
                    replays: [
                        DEBUG_REPLAY,
                    ]
                });
            } else callback(null);
        }
        xml.send();
    }

    static GetReplay(levelID, replayID, callback) {
        let xml = new XMLHttpRequest();
        xml.open("GET", SERVER_URL+"/"+levelID+"/"+replayID+".acrp");
        xml.responseType = "arraybuffer";
        xml.onload = () => {
            callback(xml.response);
        }
        xml.onerror = () => {
            if (DEBUG) { 
                callback(new Uint8Array(DEBUG_REPLAY.d).buffer);
            } else callback(null);
        }
        xml.send();
    }
}