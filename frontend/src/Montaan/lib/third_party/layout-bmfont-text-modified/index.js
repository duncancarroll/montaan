var wordWrap = require('../word-wrapper-modified');

var X_HEIGHTS = ['x', 'e', 'a', 'o', 'n', 's', 'r', 'c', 'u', 'm', 'v', 'w', 'z'];
var M_WIDTHS = ['m', 'w'];
var CAP_HEIGHTS = ['H', 'I', 'N', 'E', 'F', 'K', 'L', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

var TAB_ID = '\t'.charCodeAt(0);
var SPACE_ID = ' '.charCodeAt(0);
var ALIGN_LEFT = 0,
	ALIGN_CENTER = 1,
	ALIGN_RIGHT = 2;

export default async function createLayout(opt, yieldFn) {
	var layout = new TextLayout();
	await layout.update(opt, yieldFn);
	return layout;
}

function TextLayout() {
	this.glyphs = [];
	this._measure = this.computeMetrics.bind(this);
}

TextLayout.prototype.update = async function(opt, yieldFn) {
	opt.measure = this._measure;
	this._opt = opt;
	if (this._opt.tabSize === undefined) this._opt.tabSize = 4;

	if (!opt.font) throw new Error('must provide a valid bitmap font');

	var glyphs = this.glyphs;
	var text = opt.text || '';
	var font = opt.font;
	this._setupSpaceGlyphs(font);

	var lines = wordWrap.lines(text, opt);
	var minWidth = opt.width || 0;

	// console.log('lines:', lines.length, text.split('\n').length);

	//clear glyphs
	glyphs.length = 0;

	//get max line width
	var maxLineWidth = minWidth;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].width > maxLineWidth) maxLineWidth = lines[i].width;
	}

	//the pen position
	var x = 0;
	var y = 0;
	var lineHeight = opt.lineHeight;
	if (lineHeight === undefined) lineHeight = font.common.lineHeight;
	var baseline = font.common.base;
	var descender = lineHeight - baseline;
	var letterSpacing = opt.letterSpacing || 0;
	var height = lineHeight * lines.length - descender;
	var align = getAlignType(this._opt.align);

	//draw text along baseline
	y -= height;

	//the metrics for this text layout
	this._width = maxLineWidth;
	this._height = height;
	this._descender = lineHeight - baseline;
	this._baseline = baseline;
	this._xHeight = getXHeight(font);
	this._capHeight = getCapHeight(font);
	this._lineHeight = lineHeight;
	this._ascender = lineHeight - descender - this._xHeight;

	//layout each glyph
	for (let lineIndex = 0, ccount = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex];
		var start = line.start;
		var end = line.end;
		var lineWidth = line.width;
		var lastGlyph;

		//for each glyph in that line...
		for (let i = start; i < end; i++, ccount++) {
			if (ccount % 3000 === 2999) await yieldFn();
			var id = text.charCodeAt(i);
			var glyph = this.getGlyph(font, id) || this.getGlyph(font, '?'.charCodeAt(0));
			if (glyph) {
				if (lastGlyph) x += getKerning(font, lastGlyph.id, glyph.id);

				var tx = x;
				if (align === ALIGN_CENTER) tx += (maxLineWidth - lineWidth) / 2;
				else if (align === ALIGN_RIGHT) tx += maxLineWidth - lineWidth;

				glyphs.push({
					position: [tx, y],
					data: glyph,
					index: i,
					line: lineIndex,
				});

				//move pen forward
				x += glyph.xadvance + letterSpacing;
				lastGlyph = glyph;
			}
		}

		//next line down
		y += lineHeight;
		x = 0;
	}
	this._linesTotal = lines.length;
};

TextLayout.prototype._setupSpaceGlyphs = function(font) {
	//These are fallbacks, when the font doesn't include
	//' ' or '\t' glyphs
	this._fallbackSpaceGlyph = null;
	this._fallbackTabGlyph = null;

	if (!font.chars || font.chars.length === 0) return;

	//try to get space glyph
	//then fall back to the 'm' or 'w' glyphs
	//then fall back to the first glyph available
	var space = getGlyphById(font, SPACE_ID) || getMGlyph(font) || font.chars[0];

	//and create a fallback for tab
	var tabWidth = this._opt.tabSize * space.xadvance;
	this._fallbackSpaceGlyph = space;
	this._fallbackTabGlyph = {
		...space,
		x: 0,
		y: 0,
		xadvance: tabWidth,
		id: TAB_ID,
		xoffset: 0,
		yoffset: 0,
		width: 0,
		height: 0,
	};
};

TextLayout.prototype.getGlyph = function(font, id) {
	var glyph = getGlyphById(font, id);
	if (glyph) return glyph;
	else if (id === TAB_ID) return this._fallbackTabGlyph;
	else if (id === SPACE_ID) return this._fallbackSpaceGlyph;
	return null;
};

TextLayout.prototype.computeMetrics = function(text, start, end, width) {
	var letterSpacing = this._opt.letterSpacing || 0;
	var font = this._opt.font;
	var curPen = 0;
	var curWidth = 0;
	var count = 0;
	var glyph;
	var lastGlyph;

	if (!font.chars || font.chars.length === 0) {
		return {
			start: start,
			end: start,
			width: 0,
		};
	}

	end = Math.min(text.length, end);
	for (var i = start; i < end; i++) {
		var id = text.charCodeAt(i);
		glyph = this.getGlyph(font, id);

		if (glyph) {
			//move pen forward
			// var xoff = glyph.xoffset
			var kern = lastGlyph ? getKerning(font, lastGlyph.id, glyph.id) : 0;
			curPen += kern;

			var nextPen = curPen + glyph.xadvance + letterSpacing;
			var nextWidth = curPen + glyph.width;

			//we've hit our limit; we can't move onto the next glyph
			if (nextWidth >= width || nextPen >= width) break;

			//otherwise continue along our line
			curPen = nextPen;
			curWidth = nextWidth;
			lastGlyph = glyph;
		}
		count++;
	}

	//make sure rightmost edge lines up with rendered glyphs
	if (lastGlyph) curWidth += lastGlyph.xoffset;

	return {
		start: start,
		end: start + count,
		width: curWidth,
	};
};

Object.defineProperty(TextLayout.prototype, 'width', {
	get: function() {
		return this._width;
	},
	configurable: true,
});
Object.defineProperty(TextLayout.prototype, 'height', {
	get: function() {
		return this._height;
	},
	configurable: true,
});
Object.defineProperty(TextLayout.prototype, 'descender', {
	get: function() {
		return this._descender;
	},
	configurable: true,
});
Object.defineProperty(TextLayout.prototype, 'ascender', {
	get: function() {
		return this._ascender;
	},
	configurable: true,
});
Object.defineProperty(TextLayout.prototype, 'xHeight', {
	get: function() {
		return this._xHeight;
	},
	configurable: true,
});
Object.defineProperty(TextLayout.prototype, 'baseline', {
	get: function() {
		return this._baseline;
	},
	configurable: true,
});
Object.defineProperty(TextLayout.prototype, 'capHeight', {
	get: function() {
		return this._capHeight;
	},
	configurable: true,
});
Object.defineProperty(TextLayout.prototype, 'lineHeight', {
	get: function() {
		return this._lineHeight;
	},
	configurable: true,
});

function getGlyphById(font, id) {
	if (!font.chars || font.chars.length === 0) return null;

	var glyphIdx = findChar(font.chars, id);
	if (glyphIdx >= 0) return font.chars[glyphIdx];
	return null;
}

function getXHeight(font) {
	for (var i = 0; i < X_HEIGHTS.length; i++) {
		var id = X_HEIGHTS[i].charCodeAt(0);
		var idx = findChar(font.chars, id);
		if (idx >= 0) return font.chars[idx].height;
	}
	return 0;
}

function getMGlyph(font) {
	for (var i = 0; i < M_WIDTHS.length; i++) {
		var id = M_WIDTHS[i].charCodeAt(0);
		var idx = findChar(font.chars, id);
		if (idx >= 0) return font.chars[idx];
	}
	return 0;
}

function getCapHeight(font) {
	for (var i = 0; i < CAP_HEIGHTS.length; i++) {
		var id = CAP_HEIGHTS[i].charCodeAt(0);
		var idx = findChar(font.chars, id);
		if (idx >= 0) return font.chars[idx].height;
	}
	return 0;
}

function getKerning(font, left, right) {
	if (!font.kernings || font.kernings.length === 0) return 0;

	var table = font.kernings;
	for (var i = 0; i < table.length; i++) {
		var kern = table[i];
		if (kern.first === left && kern.second === right) return kern.amount;
	}
	return 0;
}

function getAlignType(align) {
	if (align === 'center') return ALIGN_CENTER;
	else if (align === 'right') return ALIGN_RIGHT;
	return ALIGN_LEFT;
}

function findChar(array, value, start) {
	start = start || 0;
	for (var i = start; i < array.length; i++) {
		if (array[i].id === value) {
			return i;
		}
	}
	return -1;
}