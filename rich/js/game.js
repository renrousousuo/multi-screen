(function() {
	//初始化场景
	var initScene = function(target) {
		var scene = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		var WIDTH = document.documentElement.offsetWidth || 800,
			HEIGHT = document.documentElement.clientHeight || 600;

		//创建摄像头
		var VIEW_ANGLE = 75,
			ASPECT = WIDTH / HEIGHT,
			NEAR = 0.1,
			FAR = 100;
		var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
		camera.position.set(0, 0, 10);
		scene.add(camera);
		return scene;
	};
	//业务代码
	var canvas = document.getElementById('stage');
	var scene = initScene(canvas);
	//场景列表
	var states = {
		'intro': {
			'enter': function() {
				//创建字幕

			},
			'leave': function() {

			}
		}
	};
	//导演类
	var Direct = function(states) {
		this.init(states);
	};
	Direct.prototype.init = function(states) {
		this.states = states;
	}
	Direct.prototype.toState = function(key, configs) {
		var states = this.states;
		states[key].enter(configs);
	}
	//初始化导演
	var dRect = new Direct(states);
	dRect.toState("intro");
})();