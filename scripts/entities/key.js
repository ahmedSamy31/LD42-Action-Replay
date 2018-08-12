//key.js
//collectable keys

class Key {
    constructor(scene, params) {
        this.scene = scene;
        this.p = vec2.clone(params.p);
        this.time = 0;
        this.keyImg = scene.res.files["images/key.svg"];
    }

    update() {
        this.time++;

        let player = this.scene.player;
        if (player != null) {
            let ctr = vec2.add([], this.p, [9, 9]);
            let dist = vec2.dist(player.p, ctr);
            if (dist < 12+12) {
                this.collect(player);
            }
        }
    }

    collect(player) {
        player.keys++;
        this.scene.game.playSound("key");
        //create a ton of particles
        let ctr = vec2.add([], this.p, [9, 9]);
        for (let i=0; i<15; i++) {
            this.scene.addParticle(
                new GenericParticle(this.scene, 2, vec2.clone(ctr), Math.random()*Math.PI*2, [0,0], 0, 1/3, -0.01, 0)
            );
        }

        this.scene.deleteEntity(this);
    }

    render(ctx) {
        ctx.drawImage(this.keyImg, this.p[0], this.p[1] + Math.sin(this.time/30)*4);
    }
}