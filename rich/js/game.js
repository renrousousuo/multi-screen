(function() {
	//创建场景
	var scene = new THREE.Scene();
	//创建透视相机
	var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
	camera.position.set(0, 0, 500);
	scene.add(camera);
	//创建渲染器并添加到画布
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	var introText = $("#intro-text");
	document.body.appendChild(renderer.domElement);
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
	//用于控制鸟类动作的类
	var Boid = function() {

		var vector = new THREE.Vector3(),
			_acceleration, _width = 500,
			_height = 500,
			_depth = 200,
			_goal, _neighborhoodRadius = 100,
			_maxSpeed = 4,
			_maxSteerForce = 0.1,
			_avoidWalls = false;

		this.position = new THREE.Vector3();
		this.velocity = new THREE.Vector3();
		_acceleration = new THREE.Vector3();

		this.setGoal = function(target) {

			_goal = target;

		}

		this.setAvoidWalls = function(value) {

			_avoidWalls = value;

		}

		this.setWorldSize = function(width, height, depth) {

			_width = width;
			_height = height;
			_depth = depth;

		}

		this.run = function(boids) {

			if (_avoidWalls) {

				vector.set(-_width, this.position.y, this.position.z);
				vector = this.avoid(vector);
				vector.multiplyScalar(5);
				_acceleration.add(vector);

				vector.set(_width, this.position.y, this.position.z);
				vector = this.avoid(vector);
				vector.multiplyScalar(5);
				_acceleration.add(vector);

				vector.set(this.position.x, -_height, this.position.z);
				vector = this.avoid(vector);
				vector.multiplyScalar(5);
				_acceleration.add(vector);

				vector.set(this.position.x, _height, this.position.z);
				vector = this.avoid(vector);
				vector.multiplyScalar(5);
				_acceleration.add(vector);

				vector.set(this.position.x, this.position.y, -_depth);
				vector = this.avoid(vector);
				vector.multiplyScalar(5);
				_acceleration.add(vector);

				vector.set(this.position.x, this.position.y, _depth);
				vector = this.avoid(vector);
				vector.multiplyScalar(5);
				_acceleration.add(vector);

			}
			/* else {

						this.checkBounds();

					}
					*/

			if (Math.random() > 0.5) {

				this.flock(boids);

			}

			this.move();

		}

		this.flock = function(boids) {

			if (_goal) {

				_acceleration.add(this.reach(_goal, 0.005));

			}

			_acceleration.add(this.alignment(boids));
			_acceleration.add(this.cohesion(boids));
			_acceleration.add(this.separation(boids));

		}

		this.move = function() {

			this.velocity.add(_acceleration);

			var l = this.velocity.length();

			if (l > _maxSpeed) {

				this.velocity.divideScalar(l / _maxSpeed);

			}

			this.position.add(this.velocity);
			_acceleration.set(0, 0, 0);

		}

		this.checkBounds = function() {

			if (this.position.x > _width) this.position.x = -_width;
			if (this.position.x < -_width) this.position.x = _width;
			if (this.position.y > _height) this.position.y = -_height;
			if (this.position.y < -_height) this.position.y = _height;
			if (this.position.z > _depth) this.position.z = -_depth;
			if (this.position.z < -_depth) this.position.z = _depth;

		}

		//

		this.avoid = function(target) {

			var steer = new THREE.Vector3();

			steer.copy(this.position);
			steer.sub(target);

			steer.multiplyScalar(1 / this.position.distanceToSquared(target));

			return steer;

		}

		this.repulse = function(target) {

			var distance = this.position.distanceTo(target);

			if (distance < 150) {

				var steer = new THREE.Vector3();

				steer.subVectors(this.position, target);
				steer.multiplyScalar(0.5 / distance);

				_acceleration.add(steer);

			}

		}

		this.reach = function(target, amount) {

			var steer = new THREE.Vector3();

			steer.subVectors(target, this.position);
			steer.multiplyScalar(amount);

			return steer;

		}

		this.alignment = function(boids) {

			var boid, velSum = new THREE.Vector3(),
				count = 0;

			for (var i = 0, il = boids.length; i < il; i++) {

				if (Math.random() > 0.6) continue;

				boid = boids[i];

				distance = boid.position.distanceTo(this.position);

				if (distance > 0 && distance <= _neighborhoodRadius) {

					velSum.add(boid.velocity);
					count++;

				}

			}

			if (count > 0) {

				velSum.divideScalar(count);

				var l = velSum.length();

				if (l > _maxSteerForce) {

					velSum.divideScalar(l / _maxSteerForce);

				}

			}

			return velSum;

		}

		this.cohesion = function(boids) {

			var boid, distance,
				posSum = new THREE.Vector3(),
				steer = new THREE.Vector3(),
				count = 0;

			for (var i = 0, il = boids.length; i < il; i++) {

				if (Math.random() > 0.6) continue;

				boid = boids[i];
				distance = boid.position.distanceTo(this.position);

				if (distance > 0 && distance <= _neighborhoodRadius) {

					posSum.add(boid.position);
					count++;

				}

			}

			if (count > 0) {

				posSum.divideScalar(count);

			}

			steer.subVectors(posSum, this.position);

			var l = steer.length();

			if (l > _maxSteerForce) {

				steer.divideScalar(l / _maxSteerForce);

			}

			return steer;

		}

		this.separation = function(boids) {

			var boid, distance,
				posSum = new THREE.Vector3(),
				repulse = new THREE.Vector3();

			for (var i = 0, il = boids.length; i < il; i++) {

				if (Math.random() > 0.6) continue;

				boid = boids[i];
				distance = boid.position.distanceTo(this.position);

				if (distance > 0 && distance <= _neighborhoodRadius) {

					repulse.subVectors(this.position, boid.position);
					repulse.normalize();
					repulse.divideScalar(distance);
					posSum.add(repulse);

				}

			}

			return posSum;

		}
	}
	var states = {
		"intro": {
			"enter": function() {
				//绘制地球和飞鸟
				var group;
				var mouseX = 0,
					mouseY = 0;
				var windowHalfX = window.innerWidth / 2;
				var windowHalfY = window.innerHeight / 2;
				var birds, bird;

				var boid, boids;
				init();
				animate();

				function init() {
					container = document.getElementById('container');
					group = new THREE.Object3D();
					scene.add(group);
					//地球
					var loader = new THREE.TextureLoader();
					loader.load('textures/land_ocean_ice_cloud_2048.jpg', function(texture) {
						var geometry = new THREE.SphereGeometry(200, 20, 20);
						var material = new THREE.MeshBasicMaterial({
							map: texture,
							overdraw: 0.5
						});
						var mesh = new THREE.Mesh(geometry, material);
						group.add(mesh);
					});
					//飞鸟
					birds = [];
					boids = [];

					for (var i = 0; i < 200; i++) {
						boid = boids[i] = new Boid();
						boid.position.x = Math.random() * 400 - 200;
						boid.position.y = Math.random() * 400 - 200;
						boid.position.z = Math.random() * 400 - 200;
						boid.velocity.x = Math.random() * 2 - 1;
						boid.velocity.y = Math.random() * 2 - 1;
						boid.velocity.z = Math.random() * 2 - 1;
						boid.setAvoidWalls(true);
						boid.setWorldSize(500, 500, 400);

						bird = birds[i] = new THREE.Mesh(new Bird(), new THREE.MeshBasicMaterial({
							color: Math.random() * 0xffffff,
							side: THREE.DoubleSide
						}));
						bird.phase = Math.floor(Math.random() * 62.83);
						scene.add(bird);
					}

					renderer.setClearColor(0xffffff);
					renderer.setSize(window.innerWidth, window.innerHeight);
					var title = $("<div class='title'>造物者的骰子</div>");
					introText.html(title);
					title.anim({
						'transform': 'translateY(300px)'
					}, 0.5, 'ease-in-out');
				}

				function animate() {
					requestAnimationFrame(animate);
					render();
				}

				function render() {
					camera.position.x += (mouseX - camera.position.x) * 0.05;
					camera.position.y += (-mouseY - camera.position.y) * 0.05;
					camera.lookAt(scene.position);
					group.rotation.y -= 0.005;
					for (var i = 0, il = birds.length; i < il; i++) {

						boid = boids[i];
						boid.run(boids);

						bird = birds[i];
						bird.position.copy(boids[i].position);

						color = bird.material.color;
						color.r = color.g = color.b = (500 - bird.position.z) / 1000;

						bird.rotation.y = Math.atan2(-boid.velocity.z, boid.velocity.x);
						bird.rotation.z = Math.asin(boid.velocity.y / boid.velocity.length());

						bird.phase = (bird.phase + (Math.max(0, bird.rotation.z) + 0.1)) % 62.83;
						bird.geometry.vertices[5].y = bird.geometry.vertices[4].y = Math.sin(bird.phase) * 5;

					}
					renderer.render(scene, camera);
				}
			},
			"leave": function() {
				scene.children = [];
				introText.html("");
			}
		},
		"drama": {
			"enter": function() {
				//播放字幕
				var dramas = [

				];
				var displayDrama = function() {

				};
			},
			"leave": function() {

			}
		},
		"game": {
			"enter": function() {
				init();
				animate();

				function init() {
					camera.position.x = 0;
					camera.position.y = 500;
					camera.position.z = 0;
					// Grid
					var size = 500,
						step = 50;

					var geometry = new THREE.Geometry();
					for (var i = -size; i <= size; i += step) {
						geometry.vertices.push(new THREE.Vector3(-size, 0, i));
						geometry.vertices.push(new THREE.Vector3(size, 0, i));
						geometry.vertices.push(new THREE.Vector3(i, 0, -size));
						geometry.vertices.push(new THREE.Vector3(i, 0, size));
					}
					var material = new THREE.LineBasicMaterial({
						color: 0x000000,
						opacity: 0.2
					});
					var line = new THREE.Line(geometry, material);
					line.type = THREE.LinePieces;
					scene.add(line);
					// Cubes
					var geometry = new THREE.BoxGeometry(50, 50, 50);
					var material = new THREE.MeshLambertMaterial({
						color: 0xffffff,
						shading: THREE.FlatShading,
						overdraw: 0.5
					});

					for (var i = 0; i < 100; i++) {
						var cube = new THREE.Mesh(geometry, material);
						cube.scale.y = Math.floor(Math.random() * 2 + 1);
						cube.position.x = Math.floor((Math.random() * 1000 - 500) / 50) * 50 + 25;
						cube.position.y = (cube.scale.y * 50) / 2;
						cube.position.z = Math.floor((Math.random() * 1000 - 500) / 50) * 50 + 25;
						scene.add(cube);
					}

					var ambientLight = new THREE.AmbientLight(Math.random() * 0x10);
					scene.add(ambientLight);
					var directionalLight = new THREE.DirectionalLight(Math.random() * 0xffffff);
					directionalLight.position.x = Math.random() - 0.5;
					directionalLight.position.y = Math.random() - 0.5;
					directionalLight.position.z = Math.random() - 0.5;
					directionalLight.position.normalize();
					scene.add(directionalLight);

					var directionalLight = new THREE.DirectionalLight(Math.random() * 0xffffff);
					directionalLight.position.x = Math.random() - 0.5;
					directionalLight.position.y = Math.random() - 0.5;
					directionalLight.position.z = Math.random() - 0.5;
					directionalLight.position.normalize();
					scene.add(directionalLight);
					renderer.setClearColor(0xf0f0f0);
					renderer.setSize(window.innerWidth, window.innerHeight);
				}

				function animate() {
					requestAnimationFrame(animate);
					render();
				}

				function render() {
					var timer = Date.now() * 0.0001;
					camera.position.x = Math.cos(timer) * 200;
					camera.position.z = Math.sin(timer) * 200;
					camera.lookAt(scene.position);
					renderer.render(scene, camera);
				}
			},
			"leave": function() {

			}
		}
	};
	var dRect = new Direct(states);
	dRect.toState("game");
})();