//particles.js
//multiple classes for particles

let PARTICLE_CONFIGS = [
    //0: fire into smoke
    {
        frames: [
            "particles/s1.png","particles/s2.png","particles/s3.png",
            "particles/s4.png","particles/s5.png","particles/s6.png", "particles/s6.png"
        ],

        velMul: 0.95,
        rotVelMul: 0.97,
        gravity: 0,
        duration: 45,
        fadeStart: 28,

        velRandom: 1,
        rotVelRandom: 0.2,
        scaleRandom: 0.33/3,
        scaleVelRandom: 0.01/3,

        enableAnim: true,
        enableColDie: false,
    },

    //1: explosion trails
    {
        frames: [
            "particles/s1.png","particles/s2.png","particles/s3.png",
            "particles/s4.png","particles/s5.png","particles/s6.png", "particles/s6.png"
        ],

        velMul: 0.95,
        rotVelMul: 0.97,
        gravity: 0.08,
        duration: 15,
        fadeStart: 10,

        velRandom: 0.1,
        rotVelRandom: 0.2,
        scaleRandom: 0,
        scaleVelRandom: 0,

        enableAnim: true,
    },

    //2: key collect
    {
        frames: [
            "particles/p1.png","particles/p2.png","particles/p3.png",
            "particles/p4.png","particles/p5.png","particles/p6.png", 
            "particles/p7.png", "particles/p8.png", "particles/p9.png",
            "particles/p10.png", "particles/p11.png"
        ],

        velMul: 0.85,
        rotVelMul: 0.97,
        gravity: 0,
        duration: 45,
        fadeStart: 25,

        velRandom: 5,
        rotVelRandom: 0.2,
        scaleRandom: 0.15,
        scaleVelRandom: 0,

        enableAnim: true,
    },

    //3: door open
    {
        frames: [
            "particles/p1.png","particles/p2.png","particles/p3.png",
            "particles/p4.png","particles/p5.png","particles/p6.png", 
            "particles/p7.png", "particles/p8.png", "particles/p9.png",
            "particles/p10.png", "particles/p11.png"
        ],

        velMul: 1.0,
        rotVelMul: 0.97,
        gravity: -0.04,
        duration: 45,
        fadeStart: 10,

        velRandom: 0.7,
        rotVelRandom: 0.2,
        scaleRandom: 0.1,
        scaleVelRandom: 0,

        enableAnim: true,
    },

    //4: level complete
    {
        frames: [
            "particles/p1.png","particles/p2.png","particles/p3.png",
            "particles/p4.png","particles/p5.png","particles/p6.png", 
            "particles/p7.png", "particles/p8.png", "particles/p9.png",
            "particles/p10.png", "particles/p11.png"
        ],

        velMul: 0.85,
        rotVelMul: 0.97,
        gravity: 0,
        duration: 70,
        fadeStart: 50,

        velRandom: 30,
        rotVelRandom: 0.2,
        scaleRandom: 0.45,
        scaleVelRandom: 0,

        enableAnim: true,
    },

    //5: jump particle
    {
        frames: [
            "particles/p1.png","particles/p2.png","particles/p3.png",
            "particles/p4.png","particles/p5.png","particles/p6.png", 
            "particles/p7.png", "particles/p8.png", "particles/p9.png",
            "particles/p10.png", "particles/p11.png"
        ],

        velMul: 0.85,
        rotVelMul: 0.97,
        gravity: 0,
        duration: 25,
        fadeStart: 0,

        velRandom: 6,
        rotVelRandom: 0.2,
        scaleRandom: 0.1,
        scaleVelRandom: 0,

        enableAnim: true,
    },
]

class GenericParticle {
    constructor(scene, type, pos, rot, vel, rVel, scale, scaleVel) {
        this.prepareStatic(scene, type);
        this.info = PARTICLE_CONFIGS[type];
        this.frames = GenericParticle.cache[type];

        this.p = pos;
        this.r = rot;
        this.v = vec2.add(vec2.create(), vel, [(Math.random()*2-1)*this.info.velRandom, (Math.random()*2-1)*this.info.velRandom]);
        this.rV = rVel + (Math.random()*2-1)*this.info.rotVelRandom;
        this.scale = scale + this.info.scaleRandom*(Math.random()*2-1);
        this.sV = scaleVel + this.info.scaleVelRandom*(Math.random()*2-1);

        this.time = 0;
        this.anim = this.info.enableAnim;
    }

    update() {
        let info = this.info;
        this.v[0] *= info.velMul;
        this.v[1] *= info.velMul;
        this.v[1] += info.gravity;
        this.rV *= info.rotVelMul;
        this.scale += this.sV;
        vec2.add(this.p, this.p, this.v);
        this.r += this.rV;

        return (++this.time > info.duration);
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.p[0], this.p[1]);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.r);

        let fadePct = 1-Math.max(0, (this.time-this.info.fadeStart)/(this.info.duration-this.info.fadeStart));

        if (this.anim) {
            let frameI = (this.time/this.info.duration)*(this.frames.length-1);
            let lframeI = Math.floor(frameI);
            let hframeI = Math.ceil(frameI);
            let img = this.frames[lframeI];
            let img2 = this.frames[hframeI];
            let i = frameI%1;

            ctx.globalAlpha = fadePct * Math.sqrt(1-i);
            ctx.drawImage(img, img.width/-2, img.height/-2); 
            ctx.globalAlpha = fadePct * i;
            ctx.drawImage(img2, img2.width/-2, img2.height/-2); 
        } else {
            let img = this.frames[0];
            ctx.globalAlpha = fadePct;
            ctx.drawImage(img, img.width/-2, img.height/-2);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    prepareStatic(scene, type) {
        if (GenericParticle.cache == null) GenericParticle.cache = [];
        if (GenericParticle.cache[type] != null) return;
        let imgs = [];
        let info = PARTICLE_CONFIGS[type];
        for (let i=0; i<info.frames.length; i++) {
            imgs.push(scene.res.files[info.frames[i]]);
        }
        GenericParticle.cache[type] = imgs;
    }
}

class Trailer {
    constructor(scene, type, pos, vel, scale, scaleVel, lifetime) {
        this.scene = scene,
        this.type = type,
        this.p = vec2.clone(pos);
        this.v = vec2.clone(vel);
        this.scale = scale;
        this.scaleVel = scaleVel;
        this.lifetime = lifetime;
        this.tock = 3;

        this.stealP = null;
    }

    update() {
        //vec2.add(this.p, this.p, this.v);
        this.v[1] += 0.08;
        if (--this.tock == 0) {
            let p = new GenericParticle(this.scene, this.type, this.p, Math.random()*Math.PI*2, vec2.scale([], this.v, 0.3), 0, this.scale, this.scaleVel);
            this.stealP = p;
            this.scene.addParticle(p);
            if (this.lifetime < 15) {
                p.time = Math.floor((1-(this.lifetime/15)) * p.info.duration);
            }
            this.tock = 3;
        }

        //var steps = 0;
        //var remainingT = 1;
        var velSeg = vec2.clone(this.v);
        var posSeg = vec2.clone(this.p);
        var result = Collider.raycast(posSeg, velSeg, this.scene.getLines(this.p));
        if (result != null) {
            this.scene.deleteEntity(this);
            return;
        } else {
            vec2.add(posSeg, posSeg, velSeg);

            //remainingT = 0;
        }
        this.p = posSeg;

        if (this.lifetime-- <= 0) this.scene.deleteEntity(this);
    }

    render(ctx) {
        if (this.stealP != null) {
            var p = this.stealP.p;
            this.stealP.p = this.p;
            this.stealP.render(ctx);
            this.stealP.p = p;
        }
    }
}