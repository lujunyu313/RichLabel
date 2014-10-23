/**
 *	简单的截屏功能 
 */

var CaptureScreen = cc.Class.extend({
	_texture: null,
	ctor: function(target) {
		var winSize = cc.director.getWinSize();
		this._texture = new cc.RenderTexture(winSize.width, winSize.height);
		this._texture.begin();
		target.visit();
		this._texture.end();
	},
	
	getTexture: function() {
		return this._texture.getSprite().texture
	},
	
	saveFile: function() {
		if(!cc.sys.isNative){
			cc.log("RenderTexture's saveToFile doesn't suppport on HTML5");
			return;
		}
		var time = Date.now();
		var nameJPG = "image-" + time + ".png";
		this._texture.saveToFile(nameJPG, cc.IMAGE_FORMAT_PNG);
	}
	
});