//door.js
//the level exit.

class Door {
    constructor(scene, info) {
        this.scene = scene;
        this.p = vec2.clone(info.p);

        this.openImg = scene.res.files["images/door_open.svg"];
        this.closedImg = scene.res.files["images/door_closed.svg"];
    }

    update() {
        let isOpen = this.scene.player.keys >= this.scene.level.keyQuota;
        if (isOpen) {
            //make particles below us. check for player intersection.
            this.scene.addParticle(
                new GenericParticle(this.scene, 3, [this.p[0]+Math.random()*28, this.p[1]+38], Math.random()*Math.PI*2, [0,0], 0, 0.7/3, -0.01, 0)
            );

            let player = this.scene.player;
            if (player != null && !player.dead) {
                let hit = (player.p[0] > this.p[0] && player.p[1] > this.p[1] && player.p[0] < this.p[0]+28 && player.p[1] < this.p[1]+38);
                if (hit) {
                    let ctr = vec2.add([], this.p, [9, 9]);
                    for (let i=0; i<45; i++) {
                        this.scene.addParticle(
                            new GenericParticle(this.scene, 4, vec2.clone(ctr), Math.random()*Math.PI*2, [0,0], 0, 1, -0.02, 0)
                        );
                    }
                    this.scene.game.playSound("finish");
                    this.scene.success(player);
                }
            }
        }
    }

    render(ctx) {
        let isOpen = this.scene.player.keys >= this.scene.level.keyQuota;
        ctx.drawImage(isOpen?this.openImg:this.closedImg, this.p[0], this.p[1]);
    }
}