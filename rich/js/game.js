(function() {
	//创建场景
	var scene = new THREE.Scene();
	//创建透视相机
	var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
	camera.position.set(0, 70, 100);
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
				var colors = [
					0x00a0e9, //休息
					0x009944, //拳击
					0xaa89bd, //画符
					0x7d0000, //使坏
					0xd1c0a5, //招财猫
					0xffffff, //普通格子
				];
				var map = [{
					x: 0,
					y: 0,
					z: -1,
					type: 1
				}, {
					x: 1,
					y: 0,
					z: -1,
					type: 5
				}, {
					x: 2,
					y: 0,
					z: -1,
					type: 0
				}, {
					x: 3,
					y: 0,
					z: -1,
					type: 5
				}, {
					x: 3,
					y: 0,
					z: -2,
					type: 2
				}, {
					x: 4,
					y: 0,
					z: -2,
					type: 4
				}, {
					x: 5,
					y: 0,
					z: -2,
					type: 3
				}, {
					x: 5,
					y: 0,
					z: -3,
					type: 5
				}, {
					x: 5,
					y: 0,
					z: -4,
					type: 5
				}, {
					x: 5,
					y: 0,
					z: -5,
					type: 5
				}, {
					x: 5,
					y: 0,
					z: -6,
					type: 1
				}, {
					x: 4,
					y: 0,
					z: -6,
					type: 5
				}, {
					x: 3,
					y: 0,
					z: -6,
					type: 0
				}, {
					x: 2,
					y: 0,
					z: -6,
					type: 5
				}, {
					x: 1,
					y: 0,
					z: -6,
					type: 2
				}, {
					x: 1,
					y: 0,
					z: -7,
					type: 4
				}, {
					x: 1,
					y: 0,
					z: -8,
					type: 3
				}, {
					x: 0,
					y: 0,
					z: -8,
					type: 5
				}, {
					x: -1,
					y: 0,
					z: -8,
					type: 5
				}, {
					x: -2,
					y: 0,
					z: -8,
					type: 5
				}, {
					x: -3,
					y: 0,
					z: -8,
					type: 1
				}, {
					x: -4,
					y: 0,
					z: -8,
					type: 5
				}, {
					x: -5,
					y: 0,
					z: -8,
					type: 0
				}, {
					x: -5,
					y: 0,
					z: -7,
					type: 5
				}, {
					x: -5,
					y: 0,
					z: -6,
					type: 2
				}, {
					x: -6,
					y: 0,
					z: -6,
					type: 4
				}, {
					x: -7,
					y: 0,
					z: -6,
					type: 3
				}, {
					x: -8,
					y: 0,
					z: -6,
					type: 5
				}, {
					x: -8,
					y: 0,
					z: -7,
					type: 5
				}, {
					x: -8,
					y: 0,
					z: -8,
					type: 5
				}, {
					x: -8,
					y: 0,
					z: -9,
					type: 1
				}, {
					x: -8,
					y: 0,
					z: -10,
					type: 5
				}, {
					x: -8,
					y: 0,
					z: -11,
					type: 0
				}, {
					x: -8,
					y: 0,
					z: -12,
					type: 5
				}, {
					x: -7,
					y: 0,
					z: -12,
					type: 2
				}, {
					x: -6,
					y: 0,
					z: -12,
					type: 2
				}]; //设置不同的格子类型和位置
				console.log(map.length);
				//创建36个格子
				for (var i = 0; i < map.length; i++) {
					var data = map[i];
					var geometry = new THREE.BoxGeometry(20, 20, 20);
					//根据类型设置颜色
					var color = colors[data.type];
					var material = new THREE.MeshBasicMaterial({
						color: color
					});
					var cube = new THREE.Mesh(geometry, material);
					cube.position.x = data.x * 20;
					cube.position.y = data.y * 20;
					cube.position.z = data.z * 20;
					scene.add(cube);
				}
				//创建终点
				var geometryEnd = new THREE.BoxGeometry(20, 20, 20);
				var materialEnd = new THREE.MeshBasicMaterial({
					color: 0xfacd89
				});
				var end = new THREE.Mesh(geometryEnd, materialEnd);
				var endPos = {
					x: -5,
					y: 0,
					z: -12
				}
				end.position.x = endPos.x * 20;
				end.position.y = endPos.y * 20;
				end.position.z = endPos.z * 20;
				scene.add(end);
				//渲染场景
				renderer.render(scene, camera);
			},
			"leave": function() {

			}
		}
	};
	var dRect = new Direct(states);
	dRect.toState("game");
})();