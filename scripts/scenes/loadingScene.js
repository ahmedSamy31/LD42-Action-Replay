//loadingScene.js

class LoadingScene {
    constructor(game) {
        this.pct = 0;
        this.game = game;
    }

    update() {

    }

    render(ctx) {
        let canvas = ctx.canvas;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, canvas.width/canvas.scale, canvas.height/canvas.scale);

        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect((canvas.width/2)/canvas.scale-50, (canvas.height/2)/canvas.scale-1.5*2, 100*this.pct, 6);

        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 0.5;
        ctx.strokeRect((canvas.width/2)/canvas.scale-25.75*2, (canvas.height/2)/canvas.scale-2.25*2, 51.5*2, 4.5*2);
        ctx.lineWidth = 1;
    }

    cleanup() {

    }

    updateProgress(pct) {
        this.pct = pct;
        if (pct == 1) this.game.start();
    }
}