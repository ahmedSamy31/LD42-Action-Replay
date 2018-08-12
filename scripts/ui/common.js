//common.js
//common UI elements

class UIButton {
    constructor(game, text, rect, onClick, textSize, alignVec, color, textColor) {
        this.game = game;
        this.text = text;
        this.rect = rect;
        this.textSize = textSize;
        if (alignVec == null) alignVec = [0,0];
        if (color == null) color = "#202020";
        if (textColor == null) textColor = "white";
        this.color = color;
        this.textColor = textColor;
        this.alignVec = alignVec;

        this.onClick = onClick;
        this.hoverPct = 0;
        //this.lastMouseState = false;
        this.down = false;
    }

    update() {
        let targSize = 0;
        let pos = this.getTruePosition();

        let input = this.game.input;

        let rel = vec2.sub([], [input.mouseX, input.mouseY], pos);
        let mouseIsOver = (rel[0] > 0 && rel[1] > 0 && rel[0] < this.rect[2] && rel[1] < this.rect[3]);
        if (mouseIsOver) {
            targSize = 1;
            if (this.down) {
                if (!input.mouse) {
                    this.down = false;
                    if (this.onClick != null && this.game.transitions.length == 0) {
                        this.onClick();
                    }
                }
            } else {
                if (input.mouse) {
                    this.down = true;
                    //play click sound?
                }
            }
        } else {
            if (this.down && !input.mouse) {
                this.down = false;
            }
        }
        if (this.down) {
            targSize = -1;
            this.hoverPct = -1;
        }

        this.hoverPct += (targSize - this.hoverPct)/10;
        //this.lastMouseState = 
    }

    getTruePosition() {
        let ctx = this.game.ctx;
        let canvas = ctx.canvas;
        let trueWidth = canvas.width;
        let trueHeight = canvas.height;
        let rect = this.rect;
        let alignVec = this.alignVec;

        let x = rect[0];
        let y = rect[1];
        x += trueWidth*alignVec[0]/2;
        y += trueHeight*alignVec[1]/2;

        return [x, y];
    }

    render(ctx) {
        let canvas = ctx.canvas;
        let trueWidth = canvas.width;
        let trueHeight = canvas.height;
        let rect = this.rect;
        let alignVec = this.alignVec;

        let x = rect[0];
        let y = rect[1];
        x += trueWidth*alignVec[0]/2;
        y += trueHeight*alignVec[1]/2;

        let scale = 1+this.hoverPct*0.2;
        ctx.save();
        ctx.translate(x+rect[2]/2, y+rect[3]/2);
        ctx.scale(scale, scale);
        ctx.fillStyle = this.color;
        ctx.fillRect(rect[2]/-2, rect[3]/-2, rect[2], rect[3]);
        ctx.fillStyle = (this.hoverPct>0)?"#FF4000":"black";
        ctx.globalAlpha = Math.abs(this.hoverPct);
        ctx.fillRect(rect[2]/-2, rect[3]/-2, rect[2], rect[3]);
        ctx.globalAlpha = 1;

        ctx.font = this.textSize+"px Frankfurter";
        ctx.fillStyle = this.textColor;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}