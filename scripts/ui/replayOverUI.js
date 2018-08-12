
class ReplayOverUI {
    constructor(game, myReplay) {
        this.game = game;

        this.buttons = [];
        this.buttons.push(new UIButton(game, "Retry", [-250, -65, 110, 50], ()=>{this.retry()}, 35, [1,2]));
        this.buttons.push(new UIButton(game, "Show Replay", [-110, -65, 220, 50], ()=>{this.replay(myReplay)}, 35, [1,2]));
        this.buttons.push(new UIButton(game, "Next!", [140, -65, 110, 50], ()=>{this.nextLevel()}, 35, [1,2], "#D90000"));

        this.inReplayButtons = [];
        this.inReplayButtons.push(new UIButton(game, "Back", [-123, -65, 110, 50], ()=>{this.show()}, 35, [2,2]));

        this.placement = null;
        this.behindTransition = true;
        this.tick = 0;
        this.activeReplay = myReplay;
        this.myReplay = myReplay;

        this.replayView = false;
        this.dead = false;
        this.levelid = this.game.currentScene.level.id;

        ReplayAPI.UploadLevelReplay(myReplay, (result) => {
            ReplayAPI.GetLevelLeaderboard(this.levelid, (leaderboard) => {
                this.populateBest(leaderboard.replays);
            })
        });

        this.locked = false;
        //api upload then request the best times
    }

    update() {
        if (this.locked) return this.dead;
        let buttons = (this.replayView)?this.inReplayButtons:this.buttons;
        for (let i=0; i < buttons.length; i++) {
            buttons[i].update();
        }
        if (this.game.transitions.length == 0) {
            this.behindTransition = false;
        }
        return this.dead;
    }

    populateBest(leaderboard) {
        //let's assume it's sorted by size (ascending)
        this.positionGen(leaderboard);

        for (let i=0; i<10; i++) {
            let vi = i;
            if (i>=leaderboard.length) break;
            //make a button for this entry
            let rp = leaderboard[vi];
            let buttonText = rp.position+". "+rp.name+" ("+rp.size+" bytes, "+this.formatTime(rp.time)+")";
            this.buttons.push(new UIButton(game, buttonText, [-250, 121+i*40, 500, 35], ()=>{
                this.getReplay(rp);
            }, 20, [1,0], "#DDDDDD", "#202020"));
        }

        //get our position. should be identical to any elem with our size.
        let valid = leaderboard.filter((rp) => rp.size == this.myReplay.size);
        if (valid.length > 0) {
            this.placement = valid[0].position;
        }
    }

    getReplay(rp) {
        this.locked = true;
        ReplayAPI.GetReplay(this.levelid, rp.id, (data) => {
            this.locked = false;
            let d = new Uint8Array(data);
            rp.d = d;
            this.replay(rp);
        });
    }

    formatTime(time) {
        let s = time/60;
        let ms = Math.floor(((s)%1)*100);
        let m = Math.floor(s/60);
        s = Math.floor(s%60).toString().padStart(2, 0);
        ms = ms.toString().padStart(2, 0);
        m = m.toString().padStart(2, 0);

        return m+":"+s+"."+ms;
    }

    positionGen(array) {
        let best = -1;
        let currentPosition = 0;
        for (let i=0; i<array.length; i++) {
            let size = array[i].size;
            if (size > best) {
                best = size;
                currentPosition++;
            }
            array[i].position = currentPosition;
        }
    }

    nextLevel() {
        this.behindTransition = true;
        this.game.addTransition(new DiagTransition(this.game, () => {
            this.game.initScene(new IngameScene(this.game, this.game.currentScene.level.nextid, null));
            this.dead = true;
        }));
    }

    replay(replayData) {
        if (replayData == this.activeReplay) {
            //just switch screen mode
            this.replayView = !this.replayView;
        } else {
            //start a transition into the replay
            this.game.addTransition(new DiagTransition(this.game, () => {
                this.game.initScene(new IngameScene(this.game, this.levelid, replayData));
                this.replayView = !this.replayView;
            }));
        }
    }

    show() {
        this.replayView = !this.replayView;
    }

    retry() {
        this.behindTransition = true;
        this.game.addTransition(new DiagTransition(this.game, () => {
            this.game.initScene(new IngameScene(this.game, this.levelid, null));
            this.dead = true;
        }));
    }

    render(ctx) {
        let buttons = (this.replayView)?this.inReplayButtons:this.buttons;

        let canvas = ctx.canvas;
        let trueWidth = canvas.width;
        let trueHeight = canvas.height;

        if (!this.replayView) {
            ctx.fillStyle = "white";
            ctx.globalAlpha = 0.75;
            ctx.fillRect(0, 0, trueWidth, trueHeight);
            ctx.globalAlpha = 1;

            let title = "Uploading Replay...";
            if (this.placement != null) {
                let place = this.placement;
                title = "You came "+place;
                if ((Math.floor(place/10)%10) != 1) {
                    switch (place%10) {
                        case 1: title += "st!"; break;
                        case 2: title += "nd!"; break;
                        case 3: title += "rd!"; break;
                    }
                }
                else title += "th!";
            }

            ctx.font = "80px Frankfurter";
            ctx.fillStyle = "#202020";
            ctx.textBaseline = "hanging";
            ctx.textAlign = "center";
            ctx.fillText(title, canvas.width/2, 25);

            ctx.font = "20px Frankfurter";
            ctx.fillStyle = "#202020";
            ctx.fillText("Leaderboards (click to view replay)", canvas.width/2, 95);

            ctx.fillStyle = "#0059B2";
            ctx.fillText(this.myReplay.size+" bytes", canvas.width/2, 10);
        }

        for (let i=0; i < buttons.length; i++) {
            buttons[i].render(ctx);
        }
    }
}