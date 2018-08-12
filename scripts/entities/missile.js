//missile.js
//the missile entity.

class Missile {
    constructor(pos, dir, scene) {
        this.scene = scene;
        this.name = "missile";

        this.p = vec2.clone(pos);
        this.v = vec2.scale(vec2.create(), dir, 6);

        this.img = scene.res.files["images/missile.svg"];

        this.angle = Math.atan2(dir[1], dir[0]);
    }

    update() {
        //constantly make particles behind us
        this.scene.addParticle(
            new GenericParticle(this.scene, 0, vec2.clone(this.p), Math.random()*Math.PI*2, vec2.scale([], this.v, -0.5), 0, 0.5/3, 0.01, 0)
            );

        //var steps = 0;
        //var remainingT = 1;
        var velSeg = vec2.clone(this.v);
        var posSeg = vec2.clone(this.p);
        var result = Collider.raycast(posSeg, velSeg, this.scene.getLines(this.p));
        if (result != null) {
            //we hit something. explode (probably)

            this.scene.game.playSound("exp");

            let line = result.plane;
            if (line.owner != null && line.owner.damage != null) {
                line.owner.damage(1);
            }

            for (let i=0; i<10; i++) {
                let pDir = Math.random()*Math.PI*2;
                let pVel = (1+Math.random())*1;
                let pDV = [Math.sin(pDir)*pVel, -Math.cos(pDir)*pVel];
                vec2.add(pDV, pDV, vec2.scale([], result.normal, 1.5));
                this.scene.addEntity(new Trailer(this.scene, 1, this.p, pDV, 1/3, (-1/3)/15, 60));
            }

            this.scene.deleteEntity(this);
        } else {
            vec2.add(posSeg, posSeg, velSeg);

            //remainingT = 0;
        }
        this.p = posSeg;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.p[0], this.p[1]);
        ctx.rotate(this.angle);
        ctx.drawImage(this.img, -this.img.width/2, -this.img.height/2);
        ctx.restore();
    }
}