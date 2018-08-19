//game.js
class Input {
    constructor(canvas) {
        this.canvas = canvas;
        document.body.addEventListener("mousemove", this.updateMousePos.bind(this));
        document.body.addEventListener("mousedown", this.mouseDown.bind(this));
        document.body.addEventListener("mouseup", this.mouseUp.bind(this));

        document.body.addEventListener("keydown", this.keyDown.bind(this));
        document.body.addEventListener("keyup", this.keyUp.bind(this));

        this.keys = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouse = false;
    }

    updateMousePos(evt) {
        if (document.fullscreenElement != null || document.webkitFullscreenElement != null) {
            this.mouseX = (evt.pageX)/this.canvas.scale;
            this.mouseY = (evt.pageY)/this.canvas.scale;
        } else {
            var el = this.canvas;
            var _x = 0;
            var _y = 0;
            while( el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop) ) {
                _x += el.offsetLeft;
                _y += el.offsetTop;
                el = el.offsetParent;
            }
            this.mouseX = (evt.pageX - _x)/this.canvas.scale;
            this.mouseY = (evt.pageY - _y)/this.canvas.scale;
        }
    }

    mouseDown(evt) {
        this.mouse = true;
    }

    mouseUp(evt) {
        this.mouse = false;
    }

    keyDown(evt) {
        evt.preventDefault();
        /*if (evt.keyCode == 9 || evt.keyCode == 8) {
            evt.preventDefault();
        }*/
        this.keys[evt.keyCode] = true;
    }

    keyUp(evt) {
        this.keys[evt.keyCode] = false;
    }
}

class ActionReplayGame {
    constructor(canvas) {
        this.ctx = canvas.getContext("2d");
        try {
            this.ctx.canvas = canvas;
        } catch (e) {
            //this doesnt work on new browsers, but the new functionality behaves as I would like
        }
        this.canvas = canvas;
        this.ac = new AudioContext();
        this.outGain = this.ac.createGain();
        this.outGain.connect(this.ac.destination);
        this.canvas.scale = 1;

        this.initScene(new LoadingScene());

        //todo: put in a manifest
        let files = [
            { name: "images/test.png", type: "image" },
            { name: "images/missile.svg", type: "image"},
            { name: "images/door_open.svg", type: "image"},
            { name: "images/door_closed.svg", type: "image"},
            { name: "images/key.svg", type: "image"},

            { name: "images/pidle.svg", type: "image"},
            { name: "images/pair.svg", type: "image"},
            { name: "images/pslide.svg", type: "image"},

            { name: "images/prun1.svg", type: "image"},
            { name: "images/prun2.svg", type: "image"},
            { name: "images/prun3.svg", type: "image"},

            { name: "images/bi_missile.svg", type: "image"},
            { name: "images/bi_a.svg", type: "image"},
            { name: "images/bi_w.svg", type: "image"},
            { name: "images/bi_d.svg", type: "image"},

            { name: "images/ba_missile.svg", type: "image"},
            { name: "images/ba_a.svg", type: "image"},
            { name: "images/ba_w.svg", type: "image"},
            { name: "images/ba_d.svg", type: "image"},

            { name: "images/box_1.svg", type: "image"},
            { name: "images/box_2.svg", type: "image"},
            { name: "images/box_3.svg", type: "image"},
            { name: "images/box_4.svg", type: "image"},

            { name: "particles/s1.png", type: "image"},
            { name: "particles/s2.png", type: "image"},
            { name: "particles/s3.png", type: "image"},
            { name: "particles/s4.png", type: "image"},
            { name: "particles/s5.png", type: "image"},
            { name: "particles/s6.png", type: "image"},

            { name: "particles/p1.png", type: "image"},
            { name: "particles/p2.png", type: "image"},
            { name: "particles/p3.png", type: "image"},
            { name: "particles/p4.png", type: "image"},
            { name: "particles/p5.png", type: "image"},
            { name: "particles/p6.png", type: "image"},
            { name: "particles/p7.png", type: "image"},
            { name: "particles/p8.png", type: "image"},
            { name: "particles/p9.png", type: "image"},
            { name: "particles/p10.png", type: "image"},
            { name: "particles/p11.png", type: "image"},

            { name: "levels/test-c.svg", type: "document"},
            { name: "levels/test-a.svg", type: "image"},

            //tutorial levels
            { name: "levels/l1-c.svg", type: "document"},
            { name: "levels/l1-a.svg", type: "image"},
            { name: "levels/l2-c.svg", type: "document"},
            { name: "levels/l2-a.svg", type: "image"},
            { name: "levels/l3-c.svg", type: "document"},
            { name: "levels/l3-a.svg", type: "image"},
            { name: "levels/l4-c.svg", type: "document"},
            { name: "levels/l4-a.svg", type: "image"},
            { name: "levels/l5-c.svg", type: "document"},
            { name: "levels/l5-a.svg", type: "image"},

            { name: "levels/lmot-c.svg", type: "document"},
            { name: "levels/lmot-a.svg", type: "image"},
            { name: "levels/luck-c.svg", type: "document"},
            { name: "levels/luck-a.svg", type: "image"},

            { name: "levels/upd-c.svg", type: "document"},
            { name: "levels/upd-a.svg", type: "image"},

            { name: "levels/plan-c.svg", type: "document"},
            { name: "levels/plan-a.svg", type: "image"},

            { name: "levels/rock-c.svg", type: "document"},
            { name: "levels/rock-a.svg", type: "image"},

            { name: "levels/end-c.svg", type: "document"},
            { name: "levels/end-a.svg", type: "image"},

            { name: "sound/music.ogg", type: "sound"},

            { name: "sound/exp.wav", type: "sound"},
            { name: "sound/finish.wav", type: "sound"},
            { name: "sound/jump.wav", type: "sound"},
            { name: "sound/key.wav", type: "sound"},
            { name: "sound/rocketshoot.wav", type: "sound"},
            { name: "sound/boxhit.wav", type: "sound"},
            { name: "sound/die.wav", type: "sound"},
        ];

        this.resource = new GameResource(this, files, this.currentScene.updateProgress.bind(this.currentScene));
        this.resource.load();

        this.behind = 0;
        this.lastFrame = Date.now();
        this.lagMode = 0;
        this.lowLagFrames = 0;
        this.transitions = [];
        this.overui = [];

        this.input = new Input(canvas);
        this.playerName = prompt("Enter a name to use for leaderboards!");
        if (this.playerName == null || this.playerName.length == 0) this.playerName = "Player";
        if (this.playerName.length > 32) {
            this.playerName = this.playerName.substr(0, 32);
        }

        this.tick();
    }

    playMusic(){ 
        let music = this.ac.createBufferSource();
        music.buffer = this.resource.files["sound/music.ogg"];
        music.loop = true;
        music.connect(this.outGain);
        music.start(0);
    }

    update() {
        for (let i=0; i<this.transitions.length; i++) {
            let del = this.transitions[i].update();
            if (del) this.transitions.splice(i--, 1);
        }
        for (let i=0; i<this.overui.length; i++) {
            let del = this.overui[i].update();
            if (del) this.overui.splice(i--, 1);
        }
        this.currentScene.update();
    }

    render(ctx) {
        this.currentScene.render(ctx);
        let uiafter = [];
        for (let i=0; i<this.overui.length; i++) {
            if (this.overui[i].behindTransition) this.overui[i].render(ctx);
            else uiafter.push(this.overui[i]);
        }
        for (let i=0; i<this.transitions.length; i++) {
            this.transitions[i].render(ctx);
        }
        for (let i=0; i<uiafter.length; i++) {
            uiafter[i].render(ctx);
        }
    }

    tick() {
        this.behind += Date.now() - this.lastFrame;
        this.lastFrame = Date.now();

        if (document.fullscreenElement != null || document.webkitFullscreenElement != null) {
            if ((this.canvas.width != window.innerWidth) || (this.canvas.height != window.innerHeight)) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                this.fullscreened = true;
                this.ctx.restore();
                this.ctx.save();
                this.canvas.scale = this.canvas.height/600;
                this.ctx.scale(this.canvas.scale, this.canvas.scale);
            }
        } else {
            if (this.fullscreened) {
                this.canvas.width = 800;
                this.canvas.height = 600;
                this.fullscreened = false;
                this.ctx.restore();
                this.ctx.save();
                this.canvas.scale = 1;
                this.ctx.scale(1, 1);
            }
        }

        if (!this.lagMode) {
            var lagFrames = 0;
            while (this.behind > 1000/60) {
                this.behind -= 1000/60;

                this.update();

                var frameTime = Date.now() - this.lastFrame;
                if (frameTime>14) lagFrames++;
                this.behind += frameTime;
                this.lastFrame = Date.now();
                if (lagFrames > 5) {
                    //if (mainScene.child != null && !mainScene.child.fastRope) mainScene.child.fastRope = true; 
                    //else 
                    this.lagMode = true;
                    break;
                }
            }
        } else {
            this.behind = 0;
            this.update();
            this.update();
            this.update();
            //force 20fps
            var frameTime = Date.now() - this.lastFrame;
            if (frameTime<13*3) this.lowLagFrames++;
            else this.lowLagFrames = 0;
            if (this.lowLagFrames > 10) this.lagMode = false;
        }
        this.render(this.ctx);

        requestAnimationFrame(this.tick.bind(this));
    }

    addTransition(trans, ignoreIfAlready) {
        if (ignoreIfAlready && this.transitions.length > 0) return;
        this.transitions.push(trans);
    }

    addUI(ui) {
        this.overui.push(ui);
    }

    initScene(scene) {
        //unload previous scene
        if (this.currentScene != null) {
            this.currentScene.cleanup();
        }
        this.currentScene = scene;
    }

    start() {
        this.addTransition(new DiagTransition(this, () => {
            this.playMusic();
            this.initScene(new IngameScene(this, 1, null));
        }));
    }

    playSound(snd) {
        var source = this.ac.createBufferSource();
        source.buffer = this.resource.files["sound/"+snd+".wav"];
        source.connect(this.outGain);
        source.start(0);
    }
}