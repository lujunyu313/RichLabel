/**
 *    当前支持text、br、image和animation四种标签
 *    text：文字标签
 *    br：换行标签
 *    image：图片标签，url属性为必填，否则会忽略此标签
 *    animation：帧动画标签，url、frameplist属性为必填，否则会忽略此标签
 *
 *    支持功能：
 *    1、图片、帧动画、文字混排
 *    2、利用Cocos2d-html5 v3.0新的API风格，支持多种属性，具体查看_switchAttr
 *    3、支持自动换行和手动换行
 *    4、支持动画效果，目前仅有fadeIn效果，可扩展
 *    5、支持点击事件，可以分发请求
 *
 *    example:
 *    var str = "<text fontSize=20 fontName=Verdana fontColor=#345456>明月几时有，把酒问青天。</text>" +
 *            "<image url=test_png></image>" +
 *            "<animation url=grossini_png frame=grossini_dance_01.png plist=grossini_plist delay=0.3 length=14 scale=0.3></animation>";
 *    var richLabel = new RichLabel({
 * 		textStr: str,
 * 		dimensions: cc.size(400, 450)
 * 	});
 *    richLabel.playFadeIn(10);
 */

if (typeof defaultOfRich == "undefined") {
    var defaultOfRich = {
        fontSize: 20,
        fontName: "Georgia",
        fontColor: cc.color(0, 0, 0),
        dimensions: cc.size(200, 200),
        wordPerSec: 15
    };
}

if (typeof labelStatus == "undefined") {
    var labelStatus = {
        idle: 0,
        playing: 1,
        end: 2
    };
}

var rich_label_anim_tag = 99;

var RichLabel = cc.Layer.extend({
    _fontSize: null,
    _fontName: null,
    _fontColor: null,
    _containLayer: null,
    _spriteArray: null,
    _textStr: null,
    _dimensions: null,
    _maxSize: null,
    _labelStatus: null,

    ctor: function (params) {
        this._super();

        this.init(params);
    },

    init: function (params) {
        this._super();

        params = params || {};

        this._fontSize = params.fontSize || defaultOfRich.fontSize;
        this._fontName = params.fontName || defaultOfRich.fontName;
        this._fontColor = params.fontColor || defaultOfRich.fontColor;
        this._dimensions = params.dimensions || defaultOfRich.dimensions;

        this._containLayer = new cc.Layer();
        this._containLayer.width = this._dimensions.width;
        this._containLayer.height = this._dimensions.height;
        this.addChild(this._containLayer);

        this.setLabelString(params.textStr);
        return true;
    },

    /**
     *    设置text
     *    @param {String} text
     */
    setLabelString: function (text) {
        if (this._textStr === text) {
            return;
        }

        if (!text) {
            return;
        }

        if (this._textStr) {	//删除已有的text
            this._containLayer.removeAllChildren();
            this._textStr = null;
        }

        this._labelStatus = labelStatus.idle;

        this._textStr = text;
        // 转换text
        var parseArray = this._parseString(this._textStr);
        // 将字符串拆分成单个字符
        this._formatString(parseArray);
        // 创建精灵
        this._spriteArray = this._createSprite(parseArray);
        // 调整位置
        this._adjustPosition();
    },

    /**
     *    设置尺寸
     *    @param {cc.size} dimensions
     */
    setDimensions: function (dimensions) {
        this._containLayer.width = dimensions.width;
        this._containLayer.height = dimensions.height;
        this._dimensions = dimensions;

        this._adjustPosition();
    },

    /**
     *    获取label尺寸
     *    @return {cc.size} size
     */
    getLabelSize: function () {
        return cc.size(this._maxWidth || 0, this._maxHeight || 0);
    },

    update: function (dt) {
        if (this._anim) {
            this._anim(dt);
        }
    },

    /**
     *    是否在播放动画
     *    return {boolean} isPlaying
     */
    isPlayingAnim: function () {
        return this._labelStatus == labelStatus.playing;
    },

    /**
     *    停止动画
     */
    stopAnim: function () {
        if (this._labelStatus == labelStatus.end) {
            return;
        }
        this.unscheduleUpdate();
        this._labelStatus = labelStatus.end;

        var len = this._spriteArray.length;
        for (var i = 0; i < len; i++) {
            var sprite = this._spriteArray[i];
            if (sprite.type != 'br' && sprite.type != 'space') {
                sprite.stopActionByTag(rich_label_anim_tag);
                sprite.opacity = 255;
                var children = sprite.getChildren();
                var len2 = children.length;
                for (var c = 0; c < len2; c++) {
                    children[c].stopActionByTag(rich_label_anim_tag);
                    children[c].opacity = 255;
                }
            }
        }
    },

    /**
     *    播放动画FadeIn,每秒播放多少个字，默认为15个
     *    @param{Number} wordPerSec
     *    @param{callback} cb
     */
    playFadeIn: function (wordPerSec, cb) {
        wordPerSec = wordPerSec || defaultOfRich.wordPerSec;
        cb = cb || function () {
        };

        var spriteArray = this._spriteArray;

        if (!spriteArray || 0 == spriteArray.length) {
            return;
        }

        if (this.isPlayingAnim()) {
            this.stopAnim();
        }

        this._labelStatus = labelStatus.playing;

        var delay = 1 / wordPerSec;
        var totalNum = 0;

        var len = spriteArray.length;
        for (var i = 0; i < len; i++) {
            var sprite = spriteArray[i];
            if (sprite.type != 'br' && sprite.type != 'space') {
                sprite.opacity = 0;
                var children = sprite.getChildren();
                var len2 = children.length;
                for (var c = 0; c < len2; c++) {
                    children[c].opacity = 0;
                }
                totalNum++;
            }
        }

        var totalTime = delay * totalNum;
        var curIndex = 0;
        var curTime = 0;
        var spriteIndex = 0;

        this._anim = function (dt) {
            curTime += dt;
            var index = Math.floor((curTime / totalTime) * totalNum);
            if (index >= totalNum) { 	//播放完毕
                this._labelStatus = labelStatus.end;
                this.unscheduleUpdate();
                cb();
            }

            while (curIndex < index) {
                var sprite = spriteArray[spriteIndex++];
                while (sprite.type == 'br' || sprite.type == 'space') {	//查找下一个不为换行或者行距的元素
                    if (spriteIndex > spriteArray.length) {
                        break;
                    }
                    sprite = spriteArray[spriteIndex++];
                }

                if (sprite) {
                    var action = sprite.runAction(cc.fadeIn(0.2));
                    action.setTag(rich_label_anim_tag);
                    var children = sprite.getChildren();
                    var len = children.length;
                    for (var c = 0; c < len; c++) {
                        action = children[c].runAction(cc.fadeIn(0.2));
                        action.setTag(rich_label_anim_tag);
                    }
                }

                curIndex++;
            }
        };

        this.unscheduleUpdate();
        this.scheduleUpdate();
    },

    /**
     *    文字解析，按照顺序转换成数组，每个数组对应特定的标签
     *    @param {String} str
     *    @return {Array} totalTab
     */
    _parseString: function (str) {
        var totalTab = [];
        var i, len;
        // 解析标签头
        var tagHead = str.match(/<[^<^>]+>/g);
        // 删除</>
        if (tagHead) {
            len = tagHead.length;
            for (i = 0; i < len; i++) {
                if (tagHead[i].match(/<\//)) {
                    tagHead.splice(i, 1);
                    len = tagHead.length;
                }
            }
        }
        // 普通格式label
        if (!tagHead || 0 == tagHead.length) {
            totalTab.push({
                type: 'text',
                text: str
            });
            return totalTab;
        }

        // 解析标签
        len = tagHead.length;
        for (var t = 0; t < len; t++) {
            var tab = {};
            var th = tagHead[t];
            var temTh = th.slice(1, th.length - 1); // 截取<>中的内容
            var temTab = temTh.split(" ");
            var len2 = temTab.length;
            for (i = 0; i < len2; i++) {
                var tmp = temTab[i];
                var key, value;
                if (0 == i) { // 获取标签类型
                    key = 'type';
                    value = tmp;
                } else {
                    tmp = tmp.split("=");
                    key = tmp[0];
                    value = tmp[1];
                }
                tab[key] = this._switchAttr(key, value);
            }
            // 获取文本
            if (tab.type) {
                var startIndex = th.length;
                var endIndex = str.search("</");
                var text = str.slice(startIndex, endIndex);
                if (0 < text.length) {
                    tab["text"] = text;
                }

                // 截掉已经解析的字符
                str = str.slice(startIndex + text.length, str.length);
                var index = str.search(">") + 1;
                str = str.slice(index, str.length);
            }

            if (tab) {
                totalTab.push(tab);
            }
        }
        return totalTab;
    },

    /**
     *    转换属性
     *    @param {String} key
     *    @param {String} value
     *    @return {Number|String|cc.color} value
     */
    _switchAttr: function (key, value) {
        switch (key) {
            case "width":
            case "height":
            case "anchorX":
            case "anchorY":
            case "rotation":
            case "rotationX":
            case "rotationY":
            case "scale":
            case "scaleX":
            case "scaleY":
            case "opacity":
            case "delay":
            case "length":
                if (/\./.test(value)) {
                    value = parseFloat(value);
                } else {
                    value = parseInt(value);
                }
                break;
            case "fillStyle":
            case "strokeStyle":
            case "fontColor":
                value = this._convertColor(value);
                break;
            default:
                break;
        }

        return value;
    },

    /**
     *    解析颜色
     *    @param {String} color
     *    @example "rgb(0,255,0)"
     *    @example "#345456"
     *    @example "#06c"
     */
    _convertColor: function (color) {
        var r, g, b;
        if (/rgb/.test(color)) {		//RGB模式
            var arr = color.match(/\d+/g);
            r = parseInt(arr[0]);
            g = parseInt(arr[1]);
            b = parseInt(arr[2]);
        } else if (/#/.test(color)) {	//16进制模式
            var len = color.length;
            if (len == 7) {
                r = parseInt(color.slice(1, 3), 16);
                g = parseInt(color.slice(3, 5), 16);
                b = parseInt(color.slice(5), 16);
            } else if (len == 4) {
                r = parseInt(color.charAt(1) + color.charAt(1), 16);
                g = parseInt(color.charAt(2) + color.charAt(2), 16);
                b = parseInt(color.charAt(3) + color.charAt(3), 16);
            }
        } else {	//未知模式
            cc.log("can not convert color: " + color);
            return defaultOfRich.fontColor;
        }

        return new cc.Color(r, g, b);
    },

    /**
     *    将字符串转换成单个字符
     *  @param {Array} parseArray
     */
    _formatString: function (parseArray) {
        for (var i in parseArray) {
            var parse = parseArray[i];
            if (parse.text) {
                parse.textArray = this._stringToChar(parse.text);
            }
        }
    },

    /**
     *  拆分字符串
     *  @param {String} str
     *  @return {Array} list
     */
    _stringToChar: function (str) {
        var list = [];
        var len = str.length;
        var i = 0;
        do {
            var c = str.charAt(i);
            list.push(c);
            i++;
        } while (len > i);
        return list;
    },

    /**
     *  创建文本
     *  @param {Object} attr
     *  @param {Object} parse
     *  @return {Array} spriteArray
     */
    _createText: function (attr, parse) {
        var spriteArray = [];
        var textArray = parse.textArray;
        var fontName = parse.fontName || this._fontName;
        var fontSize = parse.fontSize || this._fontSize;
        var fontColor = parse.fontColor || this._fontColor;

        var i, len = textArray.length;
        var self = this;

        for (i = 0; i < len; i++) {
            var label = new cc.LabelTTF(textArray[i], fontName, fontSize);
            attr.anchorY = 0;
            attr.color = fontColor;
            label.attr(attr);

            var node = null;

            if (parse.eventName) {
                node = new cc.Node();
                node.anchorY = 0;
                node.index = attr.index;
                node.setContentSize(label.getContentSize());

                var line = new cc.LabelTTF('_', fontName, 20);
                line.anchorY = 0;
                line.color = fontColor;
                line.y = -2;
                line.scaleX = label.getContentSize().width / line.getContentSize().width;

                node.addChild(label);
                node.addChild(line);

                cc.eventManager.addListener({
                    event: cc.EventListener.TOUCH_ONE_BY_ONE,
                    color: null,
                    onTouchBegan: function (touch, event) {
                        var target = event.getCurrentTarget();
                        var s = target.getContentSize();
                        var locationInNode = target.convertToNodeSpace(touch.getLocation());
                        var rect = cc.rect(0, 0, s.width, s.height);
                        if (cc.rectContainsPoint(rect, locationInNode)) {
                            var index = target.index;
                            var len = self._spriteArray.length;
                            for (var j = 0; j < len; j++) {
                                if (index == self._spriteArray[j].index) {
                                    var children = self._spriteArray[j].getChildren();
                                    this.color = children[0].color;
                                    for (var c = 0; c < len2; c++) {
                                        children[c].color = new cc.Color(255, 0, 0);
                                    }
                                }
                            }
                            return true;
                        }
                        return false;
                    },
                    onTouchEnded: function (touch, event) {
                        var userData = parse.userData ? JSON.parse(parse.userData) : {};
                        var data = {
                            userData: userData,
                            target: self
                        };
                        var target = event.getCurrentTarget();
                        var index = target.index;
                        var len = self._spriteArray.length;
                        for (var j = 0; j < len; j++) {
                            if (index == self._spriteArray[j].index) {
                                var children = self._spriteArray[j].getChildren();
                                var len2 = children.length;
                                for (var c = 0; c < len2; c++) {
                                    children[c].color = this.color;
                                }
                            }
                        }
                        cc.eventManager.dispatchCustomEvent(parse.eventName, data);
                    }
                }, label);
            }

            label = node ? node : label;
            spriteArray.push(label);
            this._containLayer.addChild(label);
        }

        return spriteArray;
    },

    /**
     *  创建图片
     *  @param {Object} attr
     *  @param {Object} parse
     *  @return {Object} sprite
     */
    _createImage: function (attr, parse) {
        var url = parse.url;
        if (res[parse.url]) {
            url = res[parse.url];
        }

        if (!url) {
            cc.log("url is undefined");
            return null;
        }

        var sprite = new cc.Sprite(url);
        attr.anchorY = 0;
        sprite.attr(attr);

        var self = this;
        if (parse.eventName) {
            cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                onTouchBegan: function (touch, event) {
                    var target = event.getCurrentTarget();
                    var s = target.getContentSize();
                    var locationInNode = target.convertToNodeSpace(touch.getLocation());
                    var rect = cc.rect(0, 0, s.width, s.height);
                    if (cc.rectContainsPoint(rect, locationInNode)) {
                        target.scale = target.scale * 0.8;
                        return true;
                    }
                    return false;
                },
                onTouchEnded: function (touch, event) {
                    var userData = parse.userData ? JSON.parse(parse.userData) : {};
                    var target = event.getCurrentTarget();
                    var data = {
                        userData: userData,
                        target: self
                    };
                    target.scale = target.scale / 0.8;
                    cc.eventManager.dispatchCustomEvent(parse.eventName, data);		//分发事件
                }
            }, sprite);
        }

        this._containLayer.addChild(sprite);
        return sprite;
    },

    /**
     *  创建动画
     *  @param {Object} attr
     *  @param {Object} parse
     *  @return {Object} sprite
     */
    _createAnimation: function(attr, parse) {
        var plist = parse.plist;
        if (res[plist]) {
            plist = res[plist];
        }

        if (!plist) {
            cc.log("plist is undefined");
            return null;
        }

        var url = parse.url;
        if (res[parse.url]) {
            url = res[parse.url];
        }

        if (!url) {
            cc.log("url is undefined");
            return null;
        }

        if (!parse.frame) {
            cc.log("frame is undefined");
            return null;
        }

        cc.spriteFrameCache.addSpriteFrames(plist);
        var sprite = new cc.Sprite("#" + parse.frame);
        var spritebatch = new cc.SpriteBatchNode(url);
        spritebatch.addChild(sprite);
        attr.anchorY = 0;
        sprite.attr(attr);
        this._containLayer.addChild(spritebatch);

        var file = parse.frame.split(".");
        var startIndex = parseInt(file[0].charAt(file[0].length - 1));	//第一张图片序号
        var animFrames = [];
        var str = "";
        var frame;
        var len = parse.length || 0;
        for (var i = startIndex; i < startIndex + len; i++) {
            if (10 <= i) {
                if (0 == file[0].charAt(file[0].length - 2)) {	//以两位数字标记的序号
                    str = file[0].slice(0, file[0].length - 2) + i + "." + file[1];
                } else {
                    str = file[0].slice(0, file[0].length - 1) + i + "." + file[1];
                }
            } else {
                str = file[0].slice(0, file[0].length - 1) + i + "." + file[1];
            }
            frame = cc.spriteFrameCache.getSpriteFrame(str);
            animFrames.push(frame);
        }

        var animation = new cc.Animation(animFrames, parse.delay || 0.2);
        sprite.runAction(cc.animate(animation).repeatForever());

        return sprite;
    },

    /**
     *  根据类型创建精灵
     *  @param {Array} parseArray
     *  @return {Array} spriteArray
     */
    _createSprite: function (parseArray) {
        var spriteArray = [];
        var ignoreAttr = {
            "fontName": 1,
            "fontSize": 1,
            "fontColor": 1,
            "url": 1,
            "eventName": 1,
            "userData": 1,
            "plist": 1,
            "delay": 1,
            "frame": 1,
            "length": 1
        };
        var self = this;
        var sprite;
        for (var i in parseArray) {
            (function (i) {
                var parse = parseArray[i];
                var attr = {};
                var key;
                for (key in parse) {
                    if (!ignoreAttr[key]) {
                        attr[key] = parse[key];
                    }
                }
                attr.index = i;
                switch (parse.type) {
                    case "text":	//文本
                        spriteArray = spriteArray.concat(self._createText(attr, parse));
                        break;
                    case "image":	//图片
                        sprite = self._createImage(attr, parse);
                        if (sprite) {
                            spriteArray.push(sprite);
                        }
                        break;
                    case "animation":	//动画
                        sprite = self._createAnimation(attr, parse);
                        if (sprite) {
                            spriteArray.push(sprite);
                        }
                        break;
                    case "br":		//换行
                    case "space":	//行距
                        spriteArray.push(parse);
                        break;
                    default:
                        cc.log("unknow type: " + parse.type);
                        break;
                }
            })(i);
        }
        return spriteArray;
    },

    /**
     *  获取每个精灵的位置
     *  @param {Array} spriteArray
     *  @param {Size} dimensions
     *  @return {Array} pointArray
     */
    _getPointOfSprites: function (spriteArray, dimensions) {
        var pointArray = [];
        var totalWidth = dimensions.width;
        var totalHeight = dimensions.height;

        var maxWidth = 0;
        var maxHeight = 0;

        var spriteNum = spriteArray.length;

        var curX = 0;	//当前x的偏移值
        var curY = 0;	//当前y的偏移值
        var curIndexX = 0; 	//当前横轴index
        var curIndexY = 0;	//当前纵轴index

        var pointXArray = [];	//所有精灵的x坐标
        var pointYArray = [];	//所有精灵的y坐标

        var indexYArray = [];	//精灵所在的行

        var rowArray = [];	//保存相同行的精灵数组

        var len = spriteArray.length;
        var sprite;
        for (var i = 0; i < len; i++) {
            sprite = spriteArray[i];
            var row = curIndexY;
            var pointX = 0;//spriteWidth * 0.5;

            if (sprite.type == 'br') {	//换行
                curIndexY++;
                curX = 0;
            } else if (sprite.type == 'space') {

            } else {
                var spriteWidth = sprite.getBoundingBox().width;
                pointX = spriteWidth * 0.5;
                if (curX + spriteWidth > totalWidth && totalWidth != 0) {	//超出限制
                    if (0 == curIndexX) { 	//第一个元素,不换行
                        curX = 0;
                    } else {	//不是第一个元素，换行
                        row = curIndexY + 1;
                        curX = spriteWidth;
                    }
                    curIndexX = 0;
                    curIndexY++;
                } else {
                    pointX += curX;
                    curX += spriteWidth;
                    curIndexX++;
                }
            }

            pointXArray.push(pointX);
            indexYArray.push(row);

            if (!rowArray[row]) {
                rowArray[row] = [];
            }

            rowArray[row].push(i);	//保存相同行的精灵

            if (maxWidth < curX) {
                maxWidth = curX;
            }
        }

        curY = 0;
        var rowHeightArray = [];	//每行的有坐标
        var index, pointY;
        len = rowArray.length;
        for (i = 0; i < len; i++) {
            var rowHeight = 0;
            var space = 0;
            var len2 = rowArray[i].length;
            for (var j = 0; j < len2; j++) {		//获取行的最高精灵
                index = rowArray[i][j];
                var height = 0;
                sprite = spriteArray[index];
                if (sprite.type == 'br') {	//换行
                    height = parseInt(sprite.height) || 0;
                } else if (sprite.type == 'space') { 	//行距
                    space = parseInt(sprite.height) || 0;

                } else {
                    height = sprite.getBoundingBox().height;
                }
                if (rowHeight < height) {
                    rowHeight = height;
                }
            }
            pointY = curY + rowHeight + space;
            rowHeightArray.push(-pointY + totalHeight);
            curY += rowHeight + space;

            if (maxHeight < curY) {
                maxHeight = curY;
            }
        }

        this._maxWidth = maxWidth;
        this._maxHeight = height;

        for (i = 0; i < spriteNum; i++) {
            index = indexYArray[i];
            pointY = rowHeightArray[index];
            pointYArray[i] = pointY;
        }

        pointArray.push(pointXArray, pointYArray);

        return pointArray;
    },

    /**
     *  调整位置
     */
    _adjustPosition: function () {
        var spriteArray = this._spriteArray;
        if (!spriteArray) {
            return;
        }

        var pointArray = this._getPointOfSprites(spriteArray, this._dimensions);

        for (var i = 0; i < spriteArray.length; i++) {
            var sprite = spriteArray[i];
            sprite.x = pointArray[0][i];
            sprite.y = pointArray[1][i];
        }
    }
});