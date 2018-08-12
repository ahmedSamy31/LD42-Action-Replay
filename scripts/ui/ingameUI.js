//ingameUI.js

class IngameUI {

    constructor(scene) {
        this.scene = scene;
        this.targQuotaPct = 0;
        this.quotaPct = 0;
        this.log = [];
        this.logScroll = 0; //how far from the newest entry we are.
        this.oosSize = 0;
        this.titleLine = 0;
    }

    update() {
        this.targQuotaPct = this.scene.getSpaceUsed()/this.scene.getSpaceAllowed();
        this.quotaPct += (this.targQuotaPct - this.quotaPct)/25;
        this.logScroll -= this.logScroll/10;
        if (this.oosSize > 0) {
            this.oosSize += (1-this.oosSize)/6;
        }
        this.titleLine += (150-this.titleLine)/15;
    }

    logCommand(cmd) {
        this.log.push(cmd);
        this.logScroll += 1;
    }

    render(ctx) {
        let canvas = ctx.canvas;
        let trueWidth = canvas.width;
        let trueHeight = canvas.height;

        ctx.font = "16px Frankfurter";

        //draw logs
        ctx.fillStyle = "#222222";
        ctx.textAlign = "left";
        ctx.textBaseline = "hanging";
        let player = this.scene.player;
        let idleTime = player.control.idleTime;
        let lineHeight = 18;
        let log = this.log;

        ctx.fillText("wait "+idleTime+"...", 10, 10+(-this.logScroll)*lineHeight);

        let drawn = 0;
        for (let i=log.length-1; i>=0; i--) {
            ctx.globalAlpha = (drawn >= 2)?(Math.min(1-((drawn-1)-this.logScroll)/3, 1)):1;
            if (drawn > 0) ctx.globalAlpha *= 0.5;
            ctx.fillText(log[i], 10, 10+((drawn+1)-this.logScroll)*lineHeight);
            ctx.globalAlpha = 1;
            if (++drawn == 5) break;
            //if (drawn > 0) ctx.fillStyle = "#91C4E1";
        }

        //draw buttons

        let res = this.scene.res;
        let buttons = player.control.buttons;

        ctx.drawImage(res.files["images/b"+((buttons[3])?"a":"i")+"_d.svg"], trueWidth-42, 10);
        ctx.drawImage(res.files["images/b"+((buttons[0])?"a":"i")+"_w.svg"], trueWidth-(42+37), 10);
        ctx.drawImage(res.files["images/b"+((buttons[2])?"a":"i")+"_a.svg"], trueWidth-(42+37*2), 10);
        
        ctx.drawImage(res.files["images/bi_missile.svg"], trueWidth-(42+156), 10);
        ctx.globalAlpha = player.missileHighlight / 20;
        ctx.drawImage(res.files["images/ba_missile.svg"], trueWidth-(42+156), 10);
        ctx.globalAlpha = 1;

        ctx.textAlign = "center";
        
        //draw title
        ctx.font = "20px Frankfurter";
        ctx.fillStyle = "#222222";
        ctx.fillText(this.scene.level.name, trueWidth/2, 10);

        ctx.font = "16px Frankfurter";
        if (this.scene.level.keyQuota > 0) {
            ctx.fillText(this.scene.player.keys + "/" + this.scene.level.keyQuota + " Keys Collected", trueWidth/2, 38);
        }
        ctx.fillStyle = "#222222";
        ctx.fillRect((trueWidth-this.titleLine)/2, 30, this.titleLine, 3);

        ctx.textBaseline = "middle";
        //draw quota bar

        let quotaText = "QUOTA: "+this.scene.getSpaceUsed()+"/"+this.scene.getSpaceAllowed()+"BYTES";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeText(quotaText, trueWidth/2, trueHeight-54);
        ctx.fillStyle = (this.quotaPct>0.75)?"#B20000":"#222222";
        ctx.fillText(quotaText, trueWidth/2, trueHeight-54);

        ctx.fillStyle = "white";
        ctx.fillRect(trueWidth/2-202, trueHeight - 44, 404, 36);
        ctx.fillStyle = "#222222";
        ctx.fillRect(trueWidth/2-200, trueHeight - 42, 400, 32);
        ctx.fillStyle = "white";
        ctx.fillRect(trueWidth/2-197, trueHeight - 39, 394, 26);

        //draw record
        //not supported
        /*
        ctx.textAlign = "right";
        ctx.textBaseline = "alphabetic";

        ctx.fillStyle = "#222222";
        ctx.fillText("World Record: "+this.scene.getRecord(), trueWidth-10, trueHeight-10);
        */

        //draw time
        ctx.textAlign = "left";
        let s = this.scene.time/60;
        let ms = Math.floor(((s)%1)*100);
        let m = Math.floor(s/60);
        s = Math.floor(s%60).toString().padStart(2, 0);
        ms = ms.toString().padStart(2, 0);
        m = m.toString().padStart(2, 0);

        ctx.fillText(m+":"+s+"."+ms, 10, trueHeight-10);

        //inner bar
        ctx.fillStyle = "#FF4000";
        ctx.fillRect(trueWidth/2-195, trueHeight - 37, 390*this.targQuotaPct, 22);
        ctx.fillStyle = (this.quotaPct>=1)?"red":((this.quotaPct>0.75)?"#B20000":"#222222");
        ctx.fillRect(trueWidth/2-195, trueHeight - 37, 390*this.quotaPct, 22);

        if (this.oosSize > 0) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "80px Frankfurter";
            ctx.save();
            ctx.translate(trueWidth/2, trueHeight/2);
            ctx.scale(this.oosSize, this.oosSize);
            ctx.strokeStyle = "#8C0000";
            ctx.fillStyle = "red";
            ctx.lineWidth = 20;
            ctx.strokeText("OUT OF SPACE", 0, 0);
            ctx.lineWidth = 10;
            ctx.strokeStyle = "white";
            ctx.strokeText("OUT OF SPACE", 0, 0);
            ctx.fillText("OUT OF SPACE", 0, 0);
            ctx.restore();
        }
    }
}