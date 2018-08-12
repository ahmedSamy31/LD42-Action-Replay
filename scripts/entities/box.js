//box.js
//it's destructable! it's here! it's... a box?

class DestroyBox {
    constructor(scene, info) {
        //constructed from svg. info sho]uld contain relevant info
        this.scene = scene;
        this.p = vec2.clone(info.p);
        this.size = info.size;

        this.hits = info.hits;
        if (this.hits == null) this.hits = 3;
        this.maxHits = 4;

        this.imgs = [
            scene.res.files["images/box_1.svg"],
            scene.res.files["images/box_2.svg"],
            scene.res.files["images/box_3.svg"],
            scene.res.files["images/box_4.svg"]
        ]

        this.scene = scene;
        this.colRadius = this.size[0]+this.size[1]; //area within which this is activated
        this.ctr = [this.p[0]+this.size[0]/2, this.p[1]+this.size[1]/2];
        this.highlight = 0;
        scene.subscribeCollision(this);
    }

    damage(type) {
        this.scene.game.playSound("boxHit");
        this.hits--;
        this.highlight = 20;
        if (this.hits <= 0) {
            this.scene.deleteEntity(this);
            //particles?
        }
    }

    update() {
        if (this.highlight > 0)
            this.highlight--;
    }

    render(ctx) {
        let img = this.imgs[(this.maxHits - this.hits)];
        ctx.drawImage(img, 0, 0, 30, 30, this.p[0], this.p[1], this.size[0], this.size[1]);
        if (this.highlight > 0) {
            ctx.fillStyle = "red";
            ctx.globalAlpha = this.highlight/20;
            ctx.fillRect(this.p[0], this.p[1], this.size[0], this.size[1]);
            ctx.globalAlpha = 1;
        }
    }

    kill() {
        this.scene.unsubscribeCollision(this);
    }

    getLines() {
        return [
            {p1:this.p, p2:vec2.add([], this.p, [this.size[0], 0]), owner: this},
            {p1:vec2.add([], this.p, [this.size[0], 0]), p2:vec2.add([], this.p, [this.size[0], this.size[1]]), owner: this},
            {p1:vec2.add([], this.p, [this.size[0], this.size[1]]), p2:vec2.add([], this.p, [0, this.size[1]]), owner: this},
            {p1:vec2.add([], this.p, [0, this.size[1]]), p2:this.p, owner: this},
        ];
    }
}