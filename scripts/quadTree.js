//takes object with:
//lines, base coord, limit coord
//generates a quad tree.

//ported from Animelee into ES6 since my levels have a ton of lines now. (and i still love particles)

//node format:
//{
//    leaf: bool,
//    lines: line[] (if leaf),
//    children: node[4]
//}
//
// eg.
//
// |-------|-------|
// |-|-|-|-|       |
// |---|---|       |
// |   |-|-|       |
// |---------------|
// |-|-|   |-|-|   |
// |---|---|---|---|
// |   |   |-|-|   |
// |---------------|

class QuadTree {
    constructor(col, allowance) {
        this.col = col;
        this.allowance = allowance;
        this.tree = this.generateNode(col.lines, col.base, col.limit, 0);
    }

    generateNode(subset, start, end, depth) {
        //go through all lines in subset
        //see if they intersect a circle with the allowance+diagonal size as its radius.
        //if they do, include them.
        //if there are more than a threshold, make this a non-leaf
        //however if the new diagonal size is too small, just force it as a leaf

        let newSet = [];

        let pos = [(start[0]+end[0])/2, (start[1]+end[1])/2];
        let diagSize = [end[0]-start[0], end[1]-start[1]];
        let diag = Math.sqrt(diagSize[0]*diagSize[0]+diagSize[1]*diagSize[1])/2;

        for (let i=0; i<subset.length; i++) {
            //line: p1, p2, normal
            let l = subset[i];

            let vert = vec2.sub([], pos, l.p1);
            let v2 = vec2.sub([], pos, l.p2);
            let dir = vec2.sub([], l.p1, l.p2);
            let scale = 1/(diag+this.allowance);
            vec2.scale(vert, vert, scale);
            vec2.scale(v2, v2, scale);
            vec2.scale(dir, dir, scale);

            if ( (vert[0]*vert[0]+vert[1]*vert[1] < 1) 
              || (v2[0]*v2[0]+v2[1]*v2[1] < 1) 
              || this.RootExistsCircle(vec2.dot(dir, dir), 2*vec2.dot(dir, vert), vec2.dot(vert, vert)-1)) {
                //we made it! i'd like to thank my family and friends
                newSet.push(l);
            }
        }

        if (newSet.length < 4 || (this.allowance/4 > diag)) {
            //leaf
            return {
                leaf: true,
                lines: newSet
            }
        } else {
            return {
                leaf: false,
                children: [
                    this.generateNode(newSet, start, [end[0]-diagSize[0]/2, end[1]-diagSize[1]/2], depth+1),
                    this.generateNode(newSet, [start[0]+diagSize[0]/2, start[1]], [end[0], end[1]-diagSize[1]/2], depth+1),
                    this.generateNode(newSet, [start[0], start[1]+diagSize[1]/2], [end[0]-diagSize[0]/2, end[1]], depth+1),
                    this.generateNode(newSet, [start[0]+diagSize[0]/2, start[1]+diagSize[1]/2], end, depth+1)
                ]
            }
        }
    }

    getLines(pos) {
        return this.getLinesRecursive(pos, [this.col.base[0], this.col.base[1]], [this.col.limit[0], this.col.limit[1]], this.tree);
    }

    getLinesRecursive(pos, start, end, node) {
        if (node.leaf) return node.lines;
        let xmid = (start[0]+end[0])/2;
        let ymid = (start[1]+end[1])/2;

        let xpart = ((pos[0]>xmid)?1:0);
        let ypart = ((pos[1]>ymid)?2:0);

        if (xpart) start[0] = xmid;
        else end[0] = xmid;

        if (ypart) start[1] = ymid;
        else end[1] = ymid;

        return this.getLinesRecursive(pos, start, end, node.children[xpart+ypart]);
    }

    RootExistsCircle(a, b, c) {
        let det = (b*b) - 4*(a*c);
        if (det<0) return false; //no result :'(
        else {
            det = Math.sqrt(det);
            let root1 = ((-b)-det)/(2*a)
            let root2 = ((-b)+det)/(2*a)

            if (root1 >= 0 && root1 <= 1) {
                return true;
            } else if (root2 >= 0 && root2 <= 1) {
                return true;
            } else return false;
        }
    }
}
