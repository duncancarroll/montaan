var utils = require('./utils.js');
var THREE = require('three');

module.exports = {

	quadCount: 2,

	vertsPerFile: 6 * 2,

	findFSEntry: function(ev, camera, models, highlighted) {
		var intersections = utils.findIntersectionsUnderEvent(ev, camera, (models instanceof Array) ? models : [models]);
		if (intersections.length > 0) {
			var faceIndex = intersections[0].faceIndex;
			var fsEntry = intersections[0].object.fileTree.fsIndex[Math.floor(faceIndex / (2 * this.quadCount))];
			while (fsEntry && fsEntry.scale * camera.projectionMatrix.elements[0] < 0.2) {
				if (fsEntry.parent === highlighted) {
					break;
				}
				fsEntry = fsEntry.parent;
			}
			intersections[0].fsEntry = fsEntry;
			return intersections[0];
		}
	},

	qTmp1: new THREE.Vector3(),
	qTmp2: new THREE.Vector3(),
	qTmp3: new THREE.Vector3(),
	qTmp4: new THREE.Vector3(),
	mTmp4: new THREE.Matrix4(),
	quadInsideFrustum: function(quadIndex, model, camera) {
		var vertexOff = quadIndex * 6 * this.quadCount;
		var a = this.qTmp1;
		var b = this.qTmp2;
		var c = this.qTmp3;
		var d = this.qTmp4;
		this.projectVertexToFrustum(a, vertexOff, model, camera);
		this.projectVertexToFrustum(b, vertexOff+1, model, camera);
		this.projectVertexToFrustum(c, vertexOff+2, model, camera);
		this.projectVertexToFrustum(d, vertexOff+5, model, camera);
		var minX = Math.min(a.x, b.x, c.x, d.x);
		var maxX = Math.max(a.x, b.x, c.x, d.x);
		var minY = Math.min(a.y, b.y, c.y, d.y);
		var maxY = Math.max(a.y, b.y, c.y, d.y);
		return (maxX > -1 && minX < 1 && maxY > -1 && minY < 1);
	},

	quadAtFrustumCenter: function(quadIndex, model, camera) {
		var vertexOff = quadIndex * 6 * this.quadCount;
		var a = this.qTmp1;
		var b = this.qTmp2;
		var c = this.qTmp3;
		var d = this.qTmp4;
		this.projectVertexToFrustum(a, vertexOff, model, camera);
		this.projectVertexToFrustum(b, vertexOff+1, model, camera);
		this.projectVertexToFrustum(c, vertexOff+2, model, camera);
		this.projectVertexToFrustum(d, vertexOff+5, model, camera);
		var minX = Math.min(a.x, b.x, c.x, d.x);
		var maxX = Math.max(a.x, b.x, c.x, d.x);
		var minY = Math.min(a.y, b.y, c.y, d.y);
		var maxY = Math.max(a.y, b.y, c.y, d.y);
		return (maxX > 0 && minX < 0 && maxY > 0 && minY < 0);
	},

	quadCoversFrustum: function(quadIndex, model, camera) {
		var vertexOff = quadIndex * 6 * this.quadCount;
		var a = this.qTmp1;
		var b = this.qTmp2;
		var c = this.qTmp3;
		var d = this.qTmp4;
		// this.projectVertexToFrustum(a, vertexOff, model, camera);
		// this.projectVertexToFrustum(b, vertexOff+1, model, camera);
		// this.projectVertexToFrustum(c, vertexOff+2, model, camera);
		// this.projectVertexToFrustum(d, vertexOff+5, model, camera);
		if (
			(a.x < 1 && a.x > -1 && a.y < 1 && a.y > -1) ||
			(b.x < 1 && b.x > -1 && b.y < 1 && b.y > -1) ||
			(c.x < 1 && c.x > -1 && c.y < 1 && c.y > -1) ||
			(d.x < 1 && d.x > -1 && d.y < 1 && d.y > -1)
		) {
			return false;
		}
		var minX = Math.min(a.x, b.x, c.x, d.x);
		var maxX = Math.max(a.x, b.x, c.x, d.x);
		var minY = Math.min(a.y, b.y, c.y, d.y);
		var maxY = Math.max(a.y, b.y, c.y, d.y);
		if (!(maxX > 1 && minX < -1 && maxY > 1 && minY < -1)) {
			return false;
		}
		return !(
			this.lineIntersectsFrustum(a,b) ||
			this.lineIntersectsFrustum(b,d) ||
			this.lineIntersectsFrustum(c,d) ||
			this.lineIntersectsFrustum(c,a)
		);
	},

	lineIntersectsFrustum: function(a, b) {
		if (
			(a.y < -1 && b.y < -1) ||
			(a.y > 1 && b.y > 1) ||
			(a.x < -1 && b.x < -1) ||
			(a.x > 1 && b.x > 1)
		) {
			return false;
		}
		return (
			this.lineIntersect(a.x, a.y, b.x, b.y, -1, -1, 1, -1) ||
			this.lineIntersect(a.x, a.y, b.x, b.y, -1, 1, 1, 1) ||
			this.lineIntersect(a.x, a.y, b.x, b.y, -1, -1, -1, 1) ||
			this.lineIntersect(a.x, a.y, b.x, b.y, 1, -1, 1, 1)
		);
	},

	lineIntersect: function(x1, y1, x2, y2, x3, y3, x4, y4)
	{
		var mua,mub,x,y;
		var denom,numera,numerb;
		var EPS = 1e-6;

		denom  = (y4-y3) * (x2-x1) - (x4-x3) * (y2-y1);
		numera = (x4-x3) * (y1-y3) - (y4-y3) * (x1-x3);
		numerb = (x2-x1) * (y1-y3) - (y2-y1) * (x1-x3);

		/* Are the line coincident? */
		if (Math.abs(numera) < EPS && Math.abs(numerb) < EPS && Math.abs(denom) < EPS) {
			x = (x1 + x2) / 2;
			y = (y1 + y2) / 2;
			return {x: x, y: y};
		}

		/* Are the line parallel */
		if (Math.abs(denom) < EPS) {
			return false;
		}

		/* Is the intersection along the the segments */
		mua = numera / denom;
		mub = numerb / denom;
		if (mua < 0 || mua > 1 || mub < 0 || mub > 1) {
			return false;
		}
		x = x1 + mua * (x2 - x1);
		y = y1 + mua * (y2 - y1);
		return {x: x, y: y};
	},

	projectVertexToFrustum: function(u, vertexIndex, model, camera) {
		var off = vertexIndex * 3;
		var v = model.geometry.attributes.position.array;
		u.set(v[off + 0], v[off + 1], v[off + 2]);
		u.applyMatrix4(model.modelViewMatrix);
		u.applyMatrix4(camera.projectionMatrix);
	},

	vertexInsideFrustumTmp: new THREE.Vector3(),
	vertexInsideFrustum: function(vertexIndex, model, camera) {
		var u = this.vertexInsideFrustumTmp;
		this.projectVertexToFrustum(u, vertexIndex, model, camera);
		// window.debug.textContent = ([u.x, u.y, u.z]).join(", ");
		return (u.x < 1 && u.x > -1 && u.y < 1 && u.y > -1 && u.z < 1 && u.z > -1);
	},

	makeGeometry: function(fileCount) {
		var geo = new THREE.BufferGeometry();
		var verts = new Float32Array(fileCount * 3 * 6 * this.quadCount);
		var colorVerts = new Float32Array(fileCount * 3 * 6 * this.quadCount);
		geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
		geo.setAttribute('color', new THREE.BufferAttribute(colorVerts, 3));

		// var normalVerts = new Float32Array(fileCount * 3 * 6 * 5); //* 2);
		// geo.addAttribute('normal', new THREE.BufferAttribute(normalVerts, 3));
		// for (var i=0; i<normalVerts.length; i+=3) {
		// 	normalVerts[i] = 0;
		// 	normalVerts[i+1] = 0;
		// 	normalVerts[i+2] = -1;
		// };

		return geo;
	},

	setColor: function(verts, index, color, depth) {
		var i = index * 18 * this.quadCount; //(index * 2 + 1) * 18;
		var dx = color[0], dy = color[1], dz = color[2];
		var f = 1; //((2 + (depth+3) % 8) / 16);
		dx *= f;
		dy *= f;
		dz *= f;
		var x = dx, y = dy, z = dz;
		if (color.length === 3) {
			x = dx * 1.77; y = dy * 1.88; z = dz * 1.85;
		}


		verts[i++] = dx;
		verts[i++] = dy;
		verts[i++] = dz;
		verts[i++] = dx;
		verts[i++] = dy;
		verts[i++] = dz;
		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = dx;
		verts[i++] = dy;
		verts[i++] = dz;
		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;

		for (var j=1; j<this.quadCount; j++) {
			verts[i++] = dx*0.5;
			verts[i++] = dy*0.5;
			verts[i++] = dz*0.5;
			verts[i++] = dx*0.5;
			verts[i++] = dy*0.5;
			verts[i++] = dz*0.5;
			verts[i++] = dx*0.73;
			verts[i++] = dy*0.73;
			verts[i++] = dz*0.73;

			verts[i++] = dx*0.73;
			verts[i++] = dy*0.73;
			verts[i++] = dz*0.73;
			verts[i++] = dx*0.5;
			verts[i++] = dy*0.5;
			verts[i++] = dz*0.5;
			verts[i++] = dx*0.73;
			verts[i++] = dy*0.73;
			verts[i++] = dz*0.73;
		}
	},

	makeQuad: function(verts, index, x, y, w, h, z) {

		var i = index * 18 * this.quadCount;

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x;
		verts[i++] = y + h;
		verts[i++] = z;

		verts[i++] = x;
		verts[i++] = y + h;
		verts[i++] = z;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x + w;
		verts[i++] = y + h;
		verts[i++] = z;

		verts[i++] = x + w*0.1;
		verts[i++] = y;
		verts[i++] = z-h*0.2;
		verts[i++] = x + w*0.9;
		verts[i++] = y;
		verts[i++] = z-h*0.2;
		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x + w*0.9;
		verts[i++] = y;
		verts[i++] = z-h*0.2;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y;
		// verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y;
		// verts[i++] = z;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z;

		// verts[i++] = x + w;
		// verts[i++] = y;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y;
		// verts[i++] = z;

		// verts[i++] = x + w;
		// verts[i++] = y;
		// verts[i++] = z;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z;

		return i / 3;
	}

};