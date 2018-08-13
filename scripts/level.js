//level.js
//wrapper for level data. Reads the SVG, generates a collision quad tree and sets up entity positions.


let LEVELS = [
    {
        id: 0,
        internalName: "test",
        name: "Hello World!",
        quota: 128,
        nextid: 0,
    },

    {
        id: 1,
        internalName: "l1",
        name: "WASD to Move",
        quota: 7,
        nextid: 2,
    },

    {
        id: 2,
        internalName: "l2",
        name: "Jump!",
        quota: 15,
        nextid: 3,
    },

    {
        id: 3,
        internalName: "l3",
        name: "Hold both directions to slide",
        quota: 11,
        nextid: 4,
    },

    {
        id: 4,
        internalName: "l4",
        name: "Click to Rocket Jump",
        quota: 19,
        nextid: 5,
    },

    {
        id: 5,
        internalName: "l5",
        name: "Keys and Walljumps",
        quota: 25,
        nextid: 6,
    },

    {
        id: 6,
        internalName: "lmot",
        name: "'Motivation'",
        quota: 39,
        nextid: 7,
    },

    {
        id: 7,
        internalName: "luck",
        name: "Lucky Shot",
        quota: 39,
        nextid: 8,
    },

    {
        id: 8,
        internalName: "upd",
        name: "Up and Down",
        quota: 60,
        nextid: 9,
    },

    {
        id: 9,
        internalName: "plan",
        name: "Shots Well Planned",
        quota: 85,
        nextid: 10,
    },

    {
        id: 10,
        internalName: "rock",
        name: "Rocket Maze",
        quota: 100,
        nextid: 11,
    },

    {
        id: 11,
        internalName: "end",
        name: "Thanks for Playing!",
        quota: 1024,
        nextid: 11,
    },
]

class Level {
    constructor(res, levelid) {

        this.info = LEVELS[levelid];

        let svg = res.files["levels/"+this.info.internalName+"-c.svg"];
        this.col = new SvgColParse(svg);
        this.tree = new QuadTree(this.col, 50);
        this.img = res.files["levels/"+this.info.internalName+"-a.svg"];

        this.id = this.info.id;
        this.nextid = this.info.nextid;

        this.name = this.info.name;
        this.keyQuota = 0; //generated when loading entities
        this.byteQuota = this.info.quota;

        this.svg = svg;
        this.spawnPosition = [0, 0];

        //entity descriptions after.
        //these come in the form of rectangles in the svg with name, then followed by object params in {}.
    }

    loadEntities(scene) {
        let svg = this.svg;
        let ents = svg.getElementsByTagName("rect");

        for (let i = 0; i<ents.length; i++) {
            let box = ents[i];
            let parse = box.id.replace(new RegExp("_", 'g'), " ");

            let params = {};
            let paramsStart = parse.indexOf("-");
            let paramsEnd = parse.lastIndexOf("-");

            if (paramsStart != -1 && paramsStart != paramsEnd) {
                let paramSeg = parse.substring(paramsStart+1, paramsEnd);
                let split = paramSeg.split(" ");
                for (let j=0; j<split.length; j+=2) {
                    params[split[j]] = split[j+1];
                }
            }

            params.p = [box.x.baseVal.value, box.y.baseVal.value]
            params.size = [box.getAttribute("width")-0, box.getAttribute("height")-0];

            if (paramsStart == -1) paramsStart = parse.length;
            let name = parse.substring(0, paramsStart).trim();

            switch (name) {
                case "info":
                    break;
                case "key":
                    scene.addEntity(new Key(scene, params));
                    this.keyQuota++;
                    break;
                case "door":
                    scene.addEntity(new Door(scene, params));
                    break;
                case "box":
                    scene.addEntity(new DestroyBox(scene, params));
                    break;
                case "spawn":
                    this.spawnPosition = vec2.add([], params.p, [12, 12]);
                    break;
            }
        }

    }

    getLines(pos) {
        return this.tree.getLines(pos);
    }

}