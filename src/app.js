
var HelloWorldLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();

        var size = cc.winSize;
        
        var colorLayer = new cc.LayerColor(cc.color(255,255,255,120));
        this.addChild(colorLayer);

        var obj = {a:1,b:2};
        
        var testStr = 
        		"<text fontSize=30 fontName=Georgia fontColor=rgb(0,200,0) eventName=rich_label_fadeIn userData=" + JSON.stringify(obj) + ">水调歌头</text>" + 
        		"<animation url=grossini_png frame=grossini_dance_01.png plist=grossini_plist delay=0.3 length=14 scale=0.3></animation>" +
        		"<br></br>" + 
        		"<text fontSize=20 fontName=Verdana fontColor=#345456>明月几时有，把酒问青天。</text>" + 
        		"<image url=test_png></image>" +
        		"<br></br>" +
        		"<text fontSize=21 fontName=Tahoma fontColor=#543456>不知天上宫阙，今夕是何年？</text>" + 
        		"<image url=test_png></image>" +
        		"<br></br>" +
        		"<text fontSize=22 fontName=Tahoma fontColor=#563430>我欲乘风归去，又恐琼楼玉宇，</text>" + 
        		"<image url=test_png></image>" +
        		"<br></br>" +
        		"<image url=test_png></image>" +
        		"<text fontSize=23 fontName=Impact fontColor=#542056>高处不胜寒。</text>" + 
        		"<image url=test_png></image>" +
        		"<br></br>" +
        		"<text fontSize=24 fontName=Georgia fontColor=#340456>起舞弄清影，何似在人间！</text>" + 
        		"<br height=20></br>" +
        		"<image url=test_png></image>" + "<image url=test_png></image>" + "<text>华丽的分割线</text>" + "<image url=test_png></image>" + "<image url=test_png></image>" +
        		"<br></br>" +
				"<text fontSize=25 fontName=Georgia fontColor=#045456>转朱阁，低绮户，照无眠。！</text>" + 
				"<br></br>" +
				"<text fontSize=26 fontName=Georgia fontColor=#345406>不应有恨，何事长向别时圆？</text>" + 
				"<br></br>" +
				"<text fontSize=27 fontName=Georgia fontColor=#035456>人有悲欢离合，月有阴晴圆缺，</text>" + 
				"<br></br>" +
				"<text fontSize=28 fontName=Georgia fontColor=#341056>此事古难全。</text>" + "<br></br>" +
				"<text fontSize=29 fontName=Georgia fontColor=#341090>但愿人长久，千里共婵娟。</text>" + 
				"<br></br>" + 
				"<image url=test_png eventName=rich_label_fadeIn userData=" + JSON.stringify(obj) + "></image>" +
        		"";
        
        var str = //"<text fontSize=10 fontName=Verdana fontColor=#345456>明</text>" + 
        "<animation url=grossini_png frame=grossini_dance_01.png plist=grossini_plist delay=0.3 length=14 scale=0.1></animation>";
        var testStr2 = "";
        for(var i = 0;i < 1000;i++) {
        	testStr2 = testStr2 + str;
        }
        
        var richLabel = new RichLabel({
        	textStr: testStr,
        	dimensions: cc.size(400, 450)
        });
        richLabel.x = 200;
        richLabel.y = 0;
        this.addChild(richLabel);
        
        cc.eventManager.addCustomListener("rich_label_fadeIn", function(data) {
        		richLabel.playFadeIn(10, function(){
        			cc.log("callback success");
        		});
		});
        
        var closeItem = new cc.MenuItemImage(
        		res.CloseNormal_png,
        		res.CloseSelected_png,
        		function () {

        			var captureScreen = new CaptureScreen(this);
        			var winSize = cc.director.getWinSize();
        			var sprite = new cc.Sprite(captureScreen.getTexture());
        			sprite.x = winSize.width/2;
        			sprite.y = winSize.height/2;
        			sprite.scale = 0.8;
        			sprite.flippedY = 1;
        			this.addChild(sprite, 999999);
        			
        			this.scheduleOnce(function(){
        				sprite.removeFromParent();
        			}, 2);
        			captureScreen.saveFile();
        		}, this);
        closeItem.attr({
        	x: size.width - 20,
        	y: 20,
        	anchorX: 0.5,
        	anchorY: 0.5
        });
        
        var menu = new cc.Menu(closeItem);
        menu.x = 0;
        menu.y = 0;
        this.addChild(menu, 1);
       
        return true;
    }
});

var TopLayer = cc.Layer.extend({
	ctor: function() {
		this._super();
		
		cc.eventManager.addListener({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			onTouchBegan: function(touch, event) {
				var target = event.getCurrentTarget();
				var point = touch.getLocation();
				//var locationInNode = target.convertToNodeSpace(touch.getLocation());
				var emitter = new cc.ParticleSystem(res.showClick_plist);
				emitter.scale = 0.2;
				emitter.x = point.x;
				emitter.y = point.y;
				target.addChild(emitter);
				emitter.setAutoRemoveOnFinish(true);
				
				return true;
			}
		}, this)
		
		return true;
	}
});

var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
        
        this.addChild(new TopLayer(), 999999);
    }
});

