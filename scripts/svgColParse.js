// Souped up SVGColParse, ready for round 2 (curves) and ES6

class SvgColParse {
	constructor(svg) {
		this.svg = svg;
		this.lines = [];
		this.base = [Infinity, Infinity];
		this.limit = [-Infinity, -Infinity]
		this.parse();
	}

	parse() {
		let svg = this.svg;
		let rot90 = mat2.create();
		mat2.rotate(rot90, rot90, Math.PI/2);
		this.rot90 = rot90;

		var paths = svg.getElementsByTagName("path");
		for (var j=0; j<paths.length; j++) {
			//new parser. 

			let path = new svgPathParser(paths[j].getAttribute("d"));
			let color = paths[j].getAttribute("stroke");
			if (color.length > 7) color = color.substr(0, 7); //eg. #ff0000

            let currentPosition = vec2.create();
	        let lastx2 = 0;
	        let lasty2 = 0;
	        let firstIndi = this.lines.length;
	        for (let segi=0; segi<path.length; segi++)
	        {
	        	let seg = path[segi];
	            let x1 = seg.x1;
	            let x2 = seg.x2;
	            let y1 = seg.y1;
	            let y2 = seg.y2;

	            //example command
	            //{ code:'C', command:'curveto', x1:523, y1:12, x2:373, y2:41, x:41, y:42 },
	            let newPosition = vec2.clone(currentPosition);
	            if (seg.relative) {
	            	if (x1 != null) x1 += newPosition[0];
	            	if (y1 != null) y1 += newPosition[1];
	            	if (x2 != null) x2 += newPosition[0];
	            	if (y2 != null) y2 += newPosition[1];
	                if (seg.x != null) newPosition[0] += seg.x;
	                if (seg.y != null) newPosition[1] += seg.y;
	            } else {
	                if (seg.x != null) newPosition[0] = seg.x;
	                if (seg.y != null) newPosition[1] = seg.y;
	            }

	            switch (seg.command) {
	                case "quadratic curveto":
	                    //convert quadratic bezier to cubic
	                    var qx = x1; //the quadratic control point
	                    var qy = y1;
	                    x1 = currentPosition[0] + 2/3 * (qx-currentPosition[0]);
	                    y1 = currentPosition[1] + 2/3 * (qy-currentPosition[1]);
	                    x2 = newPosition[0] + 2/3 * (qx-newPosition[0]);
	                    y2 = newPosition[1] + 2/3 * (qy-newPosition[1]);
	                case "smooth curveto":
	                    if (seg.command == "smooth curveto") {
	                        //x1 and y1 control points are reflections of x2 and y2 on last.
	                        x1 = currentPosition[0] - (lastx2);
	                        y1 = currentPosition[1] - (lasty2);
	                    }
	                case "lineto":
	                case "horizontal lineto":
	                case "vertical lineto":
	                case "curveto":
	                case "elliptical arc":
	                    this.addCurve(
	                    	[currentPosition, newPosition, 
	                    		[(x1==null)?currentPosition[0]:x1, (y1 == null)?currentPosition[1]:y1], 
	                    		[(x2==null)?newPosition[0]:x2, (y2 == null)?newPosition[1]:y2]], 
	                    	seg.command.indexOf("lineto") == -1 && seg.command != "elliptical arc", color);

	                    //add curve
	                    break;
	                case "moveto":
	                    break;
	                case "closepath":
	                	//
	                	this.addLine(this.lines[this.lines.length-1].p2, this.lines[firstIndi].p1, color);
	                	firstIndi = this.lines.length;
	                	break;
	                default:
	                    debugger;
	                    break;
	            }

	            currentPosition = newPosition;
	        }
	        
	    }
	}

	addCurve(seg, curved, color)
    {
        let subdiv = 20;
        if (curved)
        {
        	//this is a bezier curve. seg[2] and seg[3] contain the first and second control points.
            let p1 = null;
            for (let i=0; i<=subdiv; i++)
            {
                let t = i / subdiv;
                let s = 1 - t;

                //seg accesses are: start, first control point, second control point, end
                //eg. seg[0][1] is the Y component of the start point. seg[0][0] would be the X component.

                //bezier interpolation using two control points, to get an internal point for our subdivided line.
                let p2 = [
                	(s * s * s) * seg[0][0] + 3 * (s * s * t) * seg[2][0] + 3 * (s * t * t) * seg[3][0] + (t * t * t) * seg[1][0],
                	(s * s * s) * seg[0][1] + 3 * (s * s * t) * seg[2][1] + 3 * (s * t * t) * seg[3][1] + (t * t * t) * seg[1][1]
                ];

                //update the bounding box of this path if necessary
                if (p1 != null)
                {
                	this.addLine(p1, p2, color);
                }
                p1 = p2;
            }
        }
        else
        {
			this.addLine(seg[0], seg[1], color);
        }
    }

    addLine(p1, p2, color) {
		let rot90 = this.rot90;
		if (p1[0] < this.base[0]) this.base[0] = p1[0];
		if (p1[1] < this.base[1]) this.base[1] = p1[1];
		if (p1[0] > this.limit[0]) this.limit[0] = p1[0];
		if (p1[1] > this.limit[1]) this.limit[1] = p1[1];

		if (p2[0] < this.base[0]) this.base[0] = p2[0];
		if (p2[1] < this.base[1]) this.base[1] = p2[1];
		if (p2[0] > this.limit[0]) this.limit[0] = p2[0];
		if (p2[1] > this.limit[1]) this.limit[1] = p2[1];

    	let norm = vec2.sub(vec2.create(), p1, p2);
		vec2.transformMat2(norm, norm, rot90);
		vec2.normalize(norm, norm);
		this.lines.push({
			p1: p1,
			p2: p2,
			normal: norm,
			color: color
		});
    }
}
        //

			/*
			var s = paths[j].getAttribute("d").split(" ");


			var reading = false;
			var read = [];
			var last = [0, 0]
			var l = [0, 0];
			var relative = false;
			var lastRead = null;

			for (var i=0; i<s.length; i++) {
				var code = s[i].toLowerCase();
				if (reading) {
					if (code == "z" || code == "m" || code == "zm") {
						if (code == "m") i--;
						if (code == "zm") {
							s[i] = s[i].substr(1, 1);
							i--;
						}
						reading = false;
						continue;
					} else if (code == "l") {
						relative = (s[i]=="l");
						continue;
					} else {
						if (lastRead == null) {
							lastRead = s[i];
							continue;
						}
						if (relative) {
							last[0] += s[i-1]-0;
							last[1] += s[i]-0;
						} else {
							last[0] = s[i-1]-0;
							last[1] = s[i]-0;
						}
						lastRead = null;
						read.push(vec2.fromValues(last[0], last[1]));
						if (last[0] < this.base[0]) this.base[0] = last[0];
						if (last[1] < this.base[1]) this.base[1] = last[1];
						if (last[0] > this.limit[0]) this.limit[0] = last[0];
						if (last[1] > this.limit[1]) this.limit[1] = last[1];

						//add line
						if (read.length > 1) {
							var p1 = read[read.length-2];
							var p2 = read[read.length-1];

							var norm = vec2.sub(vec2.create(), p1, p2);
							vec2.transformMat2(norm, norm, rot90);
							vec2.normalize(norm, norm);
							this.lines.push({
								p1: p1,
								p2: p2,
								normal: norm
							})
						}
					}
				} else {
					if (code == "m") {
						relative = (s[i]=="m");
						reading = true;
						read = [];
						continue;
					}
				}
			}
			*/