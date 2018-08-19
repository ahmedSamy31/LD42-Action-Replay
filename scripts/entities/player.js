//player.js
//player entity

let GRAVITY = 0.08;
let minimumMove = 0.05;

let JUMP_BUTTON = 87;
let ACTION2_BUTTON = 83;
let LEFT_BUTTON = 65;
let RIGHT_BUTTON = 68;

let LEFT_ALT = 37;
let RIGHT_ALT = 39;
let JUMP_ALT = 38;

let MAX_SPEED = 6;
let MAX_AIR_SPEED = 3;
let MAX_ROCKET_SPEED = 8;
let MAX_ROCKETV_SPEED = 10;

class Control {
    constructor() {
        this.log = false;
    }

    generatePressName() {
        let names = ["jump", "~unknown~", "left", "right"];
        let differences = [];
        for (let i=0; i<4; i++) {
            if (this.oldButtons[i] != this.buttons[i]) {
                let type = (this.buttons[i])?"press ":"release ";
                differences.push(type+names[i])
            }
        }
        return differences.join(", ");
    }
}

class RecordingControl extends Control {
    constructor(player) {
        //this control records player input to a file as they play the game.
        //since the purpose of the game is to complete the level before running out of
        //allocated space, 
        super();

        this.player = player;
        this.buttons = [0,0,0,0]; //jump, ~unknown~, left, right
        this.oldButtons = [0,0,0,0];
        this.d = []; //recording data
        let magic = "ACRP"; //action replay, version 1
        for (let i=0; i<4; i++) {
            this.d.push(magic.charCodeAt(i));
        }
        this.d.push(player.scene.level.id); //level id

        this.idleTime = 0;
        this.mouseWasDown = false;
    }

    update() {
        //check buttons
        let input = this.player.scene.game.input;

        this.oldButtons = this.buttons;
        this.buttons = [
            (input.keys[JUMP_BUTTON] || input.keys[JUMP_ALT])?1:0,
            input.keys[ACTION2_BUTTON]?1:0,
            (input.keys[LEFT_BUTTON] || input.keys[LEFT_ALT])?1:0,
            (input.keys[RIGHT_BUTTON] || input.keys[RIGHT_ALT])?1:0,
        ]
        let changed = false;
        for (let i=0; i<4; i++) {
            if (this.buttons[i] != this.oldButtons[i]) changed = true;
        }

        if (changed) {
            this.d.push(this.idleTime);
            this.d.push((1<<6) | (this.buttons[0]|(this.buttons[1]<<1)|(this.buttons[2]<<2)|(this.buttons[3]<<3)));
            if (this.log) this.player.scene.alertCommand(this.idleTime, this.generatePressName(), 2);
            this.idleTime = 0;
        }

        //did the player click? fire a missile and add the command
        if (input.mouse != this.mouseWasDown && input.mouse) {
            let v = this.player.scene.camera.localizeMouse(input.mouseX, input.mouseY);
            let x = v[0] & 0xFFFF;
            let y = v[1] & 0xFFFF;

            this.d.push(this.idleTime);
            this.d.push(2<<6);
            this.d.push(x&255);
            this.d.push((x>>8)&255);
            this.d.push(y&255);
            this.d.push((y>>8)&255);

            if (x > 0x7FFF) x = x-0x10000;
            if (y > 0x7FFF) y = y-0x10000;

            if (this.log) this.player.scene.alertCommand(this.idleTime, "missile ("+x+","+y+")", 6);
            this.player.fireMissile(x, y);
            this.idleTime = 0;
        }
        this.mouseWasDown = input.mouse;

        this.idleTime++;
        if (this.idleTime > 255) {
            this.idleTime -= 255;
            //push a command saying we did nothing for 255 frames
            this.d.push(255); //255 frames since last
            this.d.push(0); //do nothing
            if (this.log) this.player.scene.alertCommand(255, "inactive", 2);
        }
    }

    getByteSize() {
        return this.d.length;
    }
}

class RecordedControl extends Control {
    constructor(player, data) {
        super();

        this.buttons = [0,0,0,0]; //jump, ~unknown~, left, right
        this.oldButtons = [0,0,0,0]; //jump, ~unknown~, left, right
        this.streamPos = 5;
        this.idleTime = 0;
        this.waitTime = 0;
        this.first = true;
        this.d = data;
    }

    update() {
        //play back the data.
        this.idleTime++; //for display
        let run = false;
        while (this.first || this.waitTime-- <= 0) {
            run = true;
            this.idleTime = 0;
            let commandSize = 0;
            let commandName = "unknown";
            if (!this.first) {

                //run a command.
                let cmd = this.d[this.streamPos++];
                switch (cmd>>6) {
                    case 0: 
                        //nothing
                        commandName = "inactive";
                        commandSize = 2;
                        break;
                    case 1:
                        //button press
                        this.oldButtons = this.buttons;
                        this.buttons = [cmd&1, (cmd>>1)&1, (cmd>>2)&1, (cmd>>3)&1];
                        commandName = this.generatePressName();
                        commandSize = 2;
                        break;
                    case 2:
                        //missile fire
                        if (this.streamPos+4 > this.d.length) {
                            this.streamPos = this.d.length; //invalid. end playback
                            break;
                        }
                        let x = this.d[this.streamPos++];
                        x |= this.d[this.streamPos++]<<8;
                        let y = this.d[this.streamPos++];
                        y |= this.d[this.streamPos++]<<8;

                        if (x > 0x7FFF) x = x-0x10000;
                        if (y > 0x7FFF) y = y-0x10000;
                        this.player.fireMissile(x, y);

                        commandName = "missile ("+x+","+y+")";
                        commandSize = 6;
                }
            } else {
                this.first = false;
            }

            //does it have a wait time afterwards?
            if (this.streamPos < this.d.length) {
                this.waitTime = this.d[this.streamPos++];
            } else {
                commandSize--;
                this.waitTime = -1;
            }

            if (this.log) this.player.scene.alertCommand(this.lastWaitTime, commandName, commandSize);
            if (this.waitTime == -1) {
                //we're at the end.
                if (this.log) this.player.scene.alertCommand(0, "end", 0);
                this.waitTime = Infinity;
            }
            this.lastWaitTime = this.waitTime;
        }
        if (!run) {
            this.oldButtons = this.buttons;
        }
    }

    getByteSize() {
        return this.streamPos;
    }
}

class Player {
    constructor(scene) {
        this.scene = scene;
        this.name = "Player";

        this.p = vec2.clone(scene.level.spawnPosition);
        this.v = [0, 0];

        this.groundTime = 0;
        this.hitTime = 0;
        this.norm = [0, 1];

        let rot90 = mat2.create();
        mat2.rotate(rot90, rot90, Math.PI/2);
        let rotm90 = mat2.create();
        mat2.rotate(rotm90, rotm90, Math.PI/-2);

        this.rot90 = rot90;
        this.rotm90 = rotm90;

        this.missileHighlight = 0;
        this.keys = 0;
        this.dead = false;

        this.imgs = [
            scene.res.files["images/pidle.svg"],
            scene.res.files["images/pslide.svg"],
            scene.res.files["images/pair.svg"],
            scene.res.files["images/prun1.svg"],
            scene.res.files["images/prun2.svg"],
            scene.res.files["images/prun3.svg"],
        ]
        this.img = this.imgs[0];
        this.runCycle = 0;
    }

    makeJump() {
        for (let i=0; i<7; i++) {
            this.scene.addParticle(
                new GenericParticle(this.scene, 5, vec2.clone(this.p), Math.random()*Math.PI*2, vec2.scale([], this.v, 2), 0, 0.5/3, -0.007, 0)
            );
        }
        this.scene.game.playSound("jump");
    }

    attachControl(control) {
        control.player = this;
        this.control = control;
    }

    update() {
        if (this.missileHighlight > 0) this.missileHighlight--;
        if (this.dead) return;
        if (this.control != null) this.control.update();

        let onGround = this.groundTime > 0;
        let onWall = this.wallTime > 0;
        //no friction when moving. holding both buttons will slide
        let frictionEnable = !(this.control.buttons[2] || this.control.buttons[3]);
        let slide = this.control.buttons[2] && this.control.buttons[3];

        let pressed = [];
        for (let i=0; i<4; i++) {
            pressed[i] = this.control.buttons[i] && !this.control.oldButtons[i];
        }

        let animMode = 0;
        if (onGround) {
            if (frictionEnable) this.v[0] *= 0.85;

            let forward = vec2.transformMat2([], this.norm, this.rotm90);

            let fspeed = vec2.dot(this.v, forward);
            this.runCycle += Math.abs(fspeed)/20;
            if (!slide) {
                let bspeed = -fspeed;
                if (this.control.buttons[2]) {
                    let diff = MAX_SPEED - fspeed;
                    diff = Math.min(0.4, diff);
                    if (diff > 0)
                        vec2.add(this.v, this.v, vec2.scale([], forward, diff))
                }

                if (this.control.buttons[3]) {
                    let diff = MAX_SPEED - bspeed;
                    diff = Math.min(0.4, diff);
                    if (diff > 0)
                        vec2.add(this.v, this.v, vec2.scale([], forward, -diff))
                }
                if (Math.abs(fspeed) > 1) {
                    animMode = Math.floor(this.runCycle%3) + 3;
                }
            } else {
                animMode = 1;
                this.scene.addParticle(
                    new GenericParticle(this.scene, 5, vec2.clone(this.p), Math.random()*Math.PI*2, vec2.scale([], this.v, 2), 0, 0.5/3, -0.007, 0)
                );
            }

            if (pressed[0]) {
                vec2.scale(this.v, forward, fspeed);
                vec2.add(this.v, this.v, vec2.scale([], this.norm, 2));
                this.groundTime = 1;
                this.v[1] += -2.5;
                this.makeJump();
            }
            this.groundTime--;
        } else {
            //if (frictionEnable) this.v[0] *= 0.98;
            let fspeed = this.v[0];
            if (!slide) {
                let bspeed = -fspeed;
                if (this.control.buttons[3]) {
                    let diff = MAX_AIR_SPEED - fspeed;
                    diff = Math.min(0.1, diff);
                    if (diff > 0)
                        this.v[0] += diff;
                }

                if (this.control.buttons[2]) {
                    let diff = MAX_AIR_SPEED - bspeed;
                    diff = Math.min(0.1, diff);
                    if (diff > 0)
                        this.v[0] -= diff;
                }
            }
            animMode = (this.hitTime > 0)?1:2;
        }
        this.img = this.imgs[animMode];

        if (onWall && !onGround) {
            if (pressed[0]) {
                let forward = vec2.transformMat2([], this.norm, this.rotm90);
                let fspeed = vec2.dot(this.v, forward);
                vec2.scale(this.v, forward, fspeed);
                this.v[0] += vec2.dot(this.wallNorm, [1, 0])*4.5;
                //vec2.add(this.v, this.v, vec2.scale([], this.wallNorm, ));
                if (this.v[1] > 0) this.v[1] = 0;
                var maxv = Math.min(-5, this.v1);
                this.v[1] += -4;
                if (this.v[1] < maxv) this.v[1] = maxv;
                this.wallTime = 1;
                this.makeJump();
            }
            this.wallTime--;
        }

        if (this.hitTime > 0) this.hitTime--;
        //COLLISION - modified from mkjs

        this.v[1] += GRAVITY;

        var steps = 0;
        var remainingT = 1;
        var velSeg = vec2.clone(this.v);
        var posSeg = vec2.clone(this.p);
        while (steps++ < 5 && remainingT > 0.01) {
            var result = Collider.sweepEllipse(posSeg, velSeg, this.scene.getLines(posSeg), [12, 12]);
            if (result != null) {
                if (result.plane.color == "#ff0000") {
                    this.scene.died(this);
                    this.blowUp();
                }
                this.colResponse(posSeg, velSeg, result)

                remainingT -= result.t;
                if (remainingT > 0.01) {
                    vec2.scale(velSeg, this.v, remainingT);
                }
            } else {
                vec2.add(posSeg, posSeg, velSeg);
                remainingT = 0;
            }
        }
        this.p = posSeg;
    }

    render(ctx) {
        if (this.dead) return;

        let norm = this.norm;
        if (this.hitTime <= 0) norm = [0, -1];

        let normForward = vec2.transformMat2([], norm, this.rotm90);

        let forward = vec2.normalize([], this.v);
        if (this.hitTime > 0 && vec2.length(this.v) < 0.01) forward = normForward;
        ctx.save();
        ctx.translate(this.p[0], this.p[1]);
        ctx.rotate(Math.atan2(forward[1], forward[0]));
        if (vec2.dot(normForward, forward) > 0) ctx.scale(1, -1);
        ctx.drawImage(this.img, -16, -16);

        

        ctx.restore();

        /*
        ctx.beginPath();
        ctx.arc(this.p[0], this.p[1], 12, 0, 2*Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
        */

        //debug draw the level
        
        /*
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        let lines = this.scene.level.getLines(this.p);//this.scene.level.col;
        for (let i=0; i<lines.length; i++) {
            ctx.moveTo(lines[i].p1[0], lines[i].p1[1]);
            ctx.lineTo(lines[i].p2[0], lines[i].p2[1]);
        }
        ctx.stroke();
        */
        
    }

    colResponse(pos, pvel, dat) {
        var n = vec2.normalize([], dat.normal);
        var adjustPos = true;

        var proj = vec2.dot(this.v, n);
        vec2.sub(this.v, this.v, vec2.scale(vec2.create(), n, proj));

        if (adjustPos) { //move back from plane slightly
            vec3.add(pos, pos, vec3.scale(vec3.create(), pvel, dat.t));
            vec3.add(pos, vec3.scale([], n, 12+minimumMove), dat.colPoint);
        } else {
            vec3.add(pos, pos, vec3.scale(vec3.create(), pvel, dat.t));
        }

        if (Math.acos(vec2.dot([0, -1], n)) < Math.PI/3.5) {
            this.groundTime = 5;
        } else if (Math.acos(vec2.dot([0, 1], n)) < Math.PI/3.5) {
            //ceiling
        } else {
            this.wallTime = 10;
            this.wallNorm = n;
        }
        this.norm = n;
        this.hitTime = 10;
    }

    blowUp() {
        //blow me up
        this.scene.game.playSound("die");
        for (let i=0; i<30; i++) {
            let pDir = Math.random()*Math.PI*2;
            let pVel = (0.5+Math.random())*4;
            let pDV = [Math.sin(pDir)*pVel, -Math.cos(pDir)*pVel];
            this.scene.addEntity(new Trailer(this.scene, 1, this.p, pDV, 1/3, (-1/3)/15, 60))
        }

        this.dead = true;
    }

    fireMissile(x, y) {
        //fire ze missiles
        //but i am le tired!
        this.scene.game.playSound("rocketshoot");
        if (this.v[1] < 0) this.v[1] = 0;

        let maxHSpeed = Math.max(MAX_ROCKET_SPEED, Math.min(-MAX_ROCKET_SPEED, Math.abs(this.v[0])));
        let maxVSpeed = Math.max(MAX_ROCKETV_SPEED, Math.min(-MAX_ROCKETV_SPEED, Math.abs(this.v[1])));

        let angle = vec2.sub([], [x,y], this.p);
        vec2.normalize(angle, angle);

        this.scene.addEntity(new Missile(this.p, angle, this.scene));
        vec2.add(this.v, this.v, vec2.mul(angle, angle, [-5, -6]));
        this.v[0] = Math.min(maxHSpeed, Math.max(-maxHSpeed, this.v[0]));
        this.v[1] = Math.min(maxVSpeed, Math.max(-maxVSpeed, this.v[1]));

        this.missileHighlight = 20;
    }
}