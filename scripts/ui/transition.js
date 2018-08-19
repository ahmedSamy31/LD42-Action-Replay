//transition.js
//

class DiagTransition {
    constructor(game, callback) {
        this.time = 0;
        this.transition = 30;
        this.duration = 60;
        this.callback = callback;
    }

    update() {
        this.time++;
        if (this.time == this.transition) {
            this.callback();
        }
        return (this.time >= this.duration);
    }

    render(ctx) {
        let canvas = ctx.canvas;

        let trueWidth = canvas.width/canvas.scale;
        let trueHeight = canvas.height/canvas.scale;

        let subdiv = 15;

        let newWidth = trueWidth+trueHeight*0.5;
        let segWidth = newWidth/subdiv;

        let overlap = 5;

        for (let i=0; i<subdiv; i++) {
            let animPct = this.time/this.duration;
            let inv = false;
            if (animPct > 0.5) {
                animPct = animPct*2 - 1;
                inv = true;
            } else {
                animPct = animPct*2;
            }

            //start time for this segment
            let start = i/(subdiv+overlap);
            animPct = (animPct-start)/((1+overlap)/subdiv);
            animPct = Math.min(1, Math.max(0, animPct));

            if (inv) animPct = 1-animPct;

            if (animPct > 0) {
                let bx = i*segWidth;
                let lx = bx+((1-animPct)*segWidth/2-1);
                let rx = bx+segWidth-((1-animPct)*segWidth/2-1);
                //draw it
                ctx.beginPath();
                ctx.moveTo(lx, 0);
                ctx.lineTo(rx, 0);

                ctx.lineTo(rx-trueHeight/2, trueHeight);
                ctx.lineTo(lx-trueHeight/2, trueHeight);

                ctx.closePath();

                ctx.fillStyle = "#222222";
                ctx.fill();
            }
        }
    }
}