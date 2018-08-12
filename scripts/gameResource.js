//resource.js
//game resource store. 

class GameResource {
    constructor(game, files, onProgress) {
        this.game = game;
        this.fileMeta = files;
        this.loadedFiles = 0;
        this.totalFiles = files.length;
        this.files = {};
        this.onProgress = onProgress;
    }

    fileLoaded() {
        ++this.loadedFiles;
        this.onProgress(this.loadedFiles/this.totalFiles);
    }

    load() {
         for (let i=0; i<this.fileMeta.length; i++) {
            let file = this.fileMeta[i];
            switch (file.type) {
                case "image":
                    this.loadImg(file.name);
                    break;
                case "sound":
                    this.loadSound(file.name);
                    break;
                default: //fileType supplies the responsetype for an xmlhttprequest
                    this.loadFile(file.name, file.type);
                    break;
            }
        }
    }

    loadImg(url) {
        let img = new Image();
        img.src = url;
        img.onload = () => {
            this.files[url] = img;
            this.fileLoaded();
        }
    }

    loadSound(url, name) {
        if (name == null) name = url; 
        let xml = new XMLHttpRequest();
        xml.open("GET", url, true);
        xml.responseType = "arraybuffer";

        xml.onload = () => {
            this.game.ac.decodeAudioData(xml.response, (buffer) => {
                this.files[name] = buffer;
                this.fileLoaded();
            }, function(){
                this.loadSound(url.substr(0, url.length-3)+"wav", url); //retry as wav
            });
        }
        xml.send();
    }

    loadFile(url, type) {
        let xml = new XMLHttpRequest();
        xml.open("GET", url);
        xml.responseType = type;
        xml.onload = () => {
            this.files[url] = xml.response;
            this.fileLoaded();
        }
        xml.send();
    }
}