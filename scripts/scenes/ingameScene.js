//ingameScene.js

//when we're like, ingame

class IngameCamera {
    constructor() {
        this.position = [0,0];
        this.angle = 0;
        this.size = [0,0];
        this.ent = null;
        this.scale = 1;
        this.targScale = 1;
    }

    update() {
        if (this.ent != null) {
            this.position = this.ent.p;
            this.targScale = 1.5-Math.sqrt(vec2.length(this.ent.v))/5;
            this.scale += (this.targScale-this.scale) / 20;
        }
    }

    applyC(ctx) {
        ctx.save();
        let canvas = ctx.canvas;
        let trueWidth = canvas.width/canvas.scale;
        let trueHeight = canvas.height/canvas.scale;
        this.size = [trueWidth, trueHeight];

        ctx.translate(trueWidth/2, trueHeight/2);
        ctx.scale(this.scale, this.scale);
        ctx.translate(trueWidth/-2, trueHeight/-2);

        ctx.translate(-(this.position[0] - trueWidth/2), -(this.position[1] - trueHeight/2));

        ctx.rotate(-this.angle);
    }

    localizeMouse(x, y) {
        return [
            (x + (this.position[0] - this.size[0]/2)),
            (y + (this.position[1] - this.size[1]/2)),
        ];
    }
}

class IngameScene {
    constructor(game, levelid, replay) {
        this.pct = 0;
        this.game = game;
        this.res = game.resource;
        this.camera = new IngameCamera();
        this.level = new Level(this.res, levelid);

        this.entities = [];
        this.deleteQueue = [];
        this.particles = [];
        this.colliders = [];
        this.time = 0;

        this.level.loadEntities(this);

        let player = new Player(this);
        let control;

        if (replay != null) {
            control = new RecordedControl(player, replay.d);
            this.level.name = replay.name;
            player.name = replay.name;
        } else {
            control = new RecordingControl(player);
        }
        control.log = true;
        player.attachControl(control);
        this.player = player;
        this.addEntity(player);
        this.camera.ent = player;

        let rot90 = mat2.create();
        mat2.rotate(rot90, rot90, Math.PI/2);
        this.rot90 = rot90;
        this.ui = new IngameUI(this);

        this.replay = replay;
        this.dead = false;
    }

    update() {
        if (!this.player.dead) this.time++;
        for (let i=0; i<this.entities.length; i++) {
            let ent = this.entities[i];
            ent.update();
        }

        let part = this.particles;
        for (let i=0; i<part.length; i++) {
            let del = part[i].update();
            if (del) part.splice(i--, 1);
        }

        while (this.deleteQueue.length > 0) {
            let del = this.deleteQueue.pop();
            let ind = this.entities.indexOf(del);

            if (ind != -1) {
                this.entities.splice(ind, 1);
            }
        }
        this.camera.update();

        if (!this.player.dead && this.getSpaceUsed() > this.getSpaceAllowed()) {
            this.player.blowUp();
            this.ui.oosSize = 10;
            setTimeout(() => {
                if (this.dead) return;
                this.game.addTransition(new DiagTransition(this.game, () => {
                    this.restart();
                }), true);
            }, 2500);
        }

        if (this.game.input.keys[82] && !this.player.dead && !this.replay) {
            this.player.blowUp();
            this.died(this.player);
        }
        this.ui.update();
    }

    restart() {
        this.game.initScene(new IngameScene(this.game, this.level.id, this.replay));
    }

    toReplayMode() {
        if (this.replay == null) {
            //we're entering replay mode
            let myRecording = this.player.control.d;
            this.replay = {
                name: this.game.playerName,
                size: myRecording.length,
                d: myRecording,
                levelid: this.level.id,
                time: this.time,
            }

            this.game.addUI(new ReplayOverUI(this.game, this.replay));

            this.restart();
        } else {
            this.restart();
        }
    }

    render(ctx) {
        let canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.camera.applyC(ctx);

        let img = this.level.img;
        ctx.drawImage(img, 0, 0);

        //fill oob
        ctx.fillStyle = "#BBBBBB";
        ctx.fillRect(-1000, -1000, 1001, 2000+img.height);
        ctx.fillRect(img.width-1, -1000, 1001, 2000+img.height);
        ctx.fillRect(0, -1000, img.width, 1001);
        ctx.fillRect(0, img.height-1, img.width, 1001);

        for (let i=0; i<this.entities.length; i++) {
            let ent = this.entities[i];
            ent.render(ctx);
        }

        let part = this.particles;
        for (let i=0; i<part.length; i++) {
            part[i].render(ctx);
        }

        ctx.restore();
        this.ui.render(ctx);
    }

    getLines(pos) {
        let rot90 = this.rot90;
        let base = this.level.getLines(pos);
        let result = [];
        result.push.apply(result, base);
        for (let i=0; i<this.colliders.length; i++) {
            let col = this.colliders[i];
            if (vec2.distance(pos, col.ctr) < col.colRadius) {
                let additional = this.colliders[i].getLines();
                //generate normals for the additional lines
                for (let j=0; j<additional.length; j++) {
                    let line = additional[j];
                    let norm = vec2.sub(vec2.create(), line.p1, line.p2);
                    vec2.transformMat2(norm, norm, rot90);
                    vec2.normalize(norm, norm);
                    line.normal = norm;
                }
                result.push.apply(result, additional);
            }
            
        }
        return result;
    }

    died(player) {
        if (player == this.player) {
            setTimeout(() => {
                if (this.dead) return;
                this.game.addTransition(new DiagTransition(this.game, () => {
                    this.restart();
                }), true);
            }, 1200);
        }
    }

    success(player) {
        player.dead = true;
        if (player == this.player) {
            setTimeout(() => {
                if (this.dead) return;
                this.game.addTransition(new DiagTransition(this.game, () => {
                    this.toReplayMode();
                }), true);
            }, 1200);
        }
    }

    cleanup() {
        this.dead = true;
    }

    updateProgress(pct) {
        this.pct = pct;
        if (pct == 1) {
            game.start();
        }
    }

    addEntity(ent) {
        this.entities.push(ent);
    }

    deleteEntity(ent) {
        if (ent.kill != null) {
            ent.kill();
        }
        this.deleteQueue.push(ent);
    }

    addParticle(part) {
        this.particles.push(part);
    }

    subscribeCollision(col) {
        this.colliders.push(col);
    }

    unsubscribeCollision(col) {
        let ind = this.colliders.indexOf(col);
        if (ind != -1)
            this.colliders.splice(ind, 1);
    }

    getSpaceUsed() {
        return this.player.control.getByteSize();
    }

    getSpaceAllowed() {
        return this.level.byteQuota;
    }
    
    getRecord() {
        return "???";
    }

    alertCommand(time, name, size) {
        if (name == "unknown") return;
        if (name == "end") this.ui.logCommand("end");
        else this.ui.logCommand("wait "+time+", "+name+" ("+size+" bytes)");
        //console.log("wait "+time+", "+name+" ("+size+" bytes)");
    }
}