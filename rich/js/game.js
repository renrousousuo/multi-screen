(function() {
	//创建场景
	var scene = new THREE.Scene();
	//创建透视相机
	var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
	camera.position.set(0, 30, 0);
	scene.add(camera);
	//创建渲染器并添加到画布
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	//字幕组件
	var introText = $("#intro-text");
	//导演类的定义
	var Direct = function(states) {
		this.init(states);
	};
	Direct.prototype.init = function(states) {
		this.states = states;
	}
	Direct.prototype.toState = function(key) {
		if (this.curState) {
			var curstate = this.states[this.curState];
			curstate.leave();
		}
		var state = this.states[key];
		this.curState = key;
		state.enter();
	}
	var states = {
		"intro": {
			"enter": function() {
				var title = $("<h1 class='title'>造物主的骰子</h1>");
				introText.append(title);
				title.on("click", function() {
					dRect.toState("drama")
				});
			},
			"leave": function() {
				introText.html('');
			}
		},
		"drama": {
			"enter": function() {
				var words = [
					"公元10000年的地球",
					"人类处于信仰崩溃晚期",
					"变得又黄又暴力",
					"对自然不再保持应有的敬畏",
					"重建一个地球的时刻来到了",
					"地球的命运",
					"掌握在身为造物主的你手中"
				];
				var idx = 0;
				var display = function() {
					if (idx === words.length) {
						dRect.toState("game");
					} else {
						var intro = $("<h2 style='opacity:0'>" + words[idx] + "</h2>");
						introText.append(intro);
						intro.anim({
							opacity: 1
						}, 1.5);
						idx++;
						setTimeout(display, 2000);
					}
				};
				display();
			},
			"leave": function() {
				introText.anim({
					opacity: 0
				}, 2, 'ease-out', function() {
					introText.html("");
				});
			}
		},
		"game": {
			"enter": function() {
				//创建36个格子
				for (var i = 0; i < 36; i++) {
					var geometry = new THREE.BoxGeometry(10, 10, 10);
					//随机颜色
					var color = parseInt(Math.random() * 255) * parseInt(Math.random() * 255) * parseInt(Math.random() * 255);
					var material = new THREE.MeshBasicMaterial({
						color: color
					});
					var cube = new THREE.Mesh(geometry, material);
					cube.position.x = -100 + 20 * i;
					cube.position.z = -100;
					scene.add(cube);
				}
				//渲染场景
				renderer.render(scene, camera);
				//创建终点
			},
			"leave": function() {

			}
		}
	};
	var dRect = new Direct(states);
	dRect.toState("game");
})();