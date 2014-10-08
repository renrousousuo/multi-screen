$(function() {
	// var cards = new _W.CardBar('cards');
	var winnerImages = [
		'images/cat_win_text.png',
		'images/dog_win_text.png'
	];
	var bgmusic = $("#bgmusic");
	var playerList = [];
	var cards;
	var configs = {
		maxPlayers: 4,
		address: 'http://172.22.74.162:8084/master',
		bossList: []
	};
	var activeBoss = [];
	var socket = io(configs.address, {    
		'reconnection':  false
	}); //创建一个socket对象
	var createQrcode  = function(text) {
		$("#qrcode").qrcode({            
			render: 'canvas',
			width: 250,
			height: 250,
			background: "#FFFFFF",
			oreground: "#F16129",
			text:  text        
		});
	};
	var stateChecker;
	//场景切换
	var states = {
		'intro': {
			enter: function(data) {
				createQrcode('http://172.22.74.162:8084/static/mobile');
				var intro = $("#templates").find('#intro');
				$("#stage").append(intro);
			},
			leave: function(data) {
				var intro = $("#stage").find('#intro');
				$("#templates").append(intro);
			}
		},
		'ready': {
			enter: function(data) {
				$("#bgmusic").attr('src', 'audios/battle.mp3');
				var images = [
					'images/3.png',
					'images/2.png',
					'images/1.png',
					'images/ready.png',
					'images/go.png'
				];
				var countImage = $("#countImage");
				var battle = $("#templates").find('#battle');
				$("#stage").append(battle);
				var ready = $("#templates").find('#ready');
				$("#stage").append(ready);
				var count = 0;
				var countDown = function() {
					if (count === 5) {
						cards = new _W.CardBar("cards");
						stateChecker.toState('battle');
					} else {
						countImage.attr("src", images[count++]);
						countImage.slideDown().slideUp();
						if (count === 4) {
							socket.emit("as_start_game", {    
								'action': "as_start_game",
								'data': {}
							});
						}
						setTimeout(countDown, 1000);
					}
				};
				setTimeout(countDown, 1000);
			},
			leave: function(data) {
				var ready = $("#stage").find('#ready');
				$("#templates").append(ready);
			}
		},
		'battle': {
			enter: function(data) {
				var catConfigs = {
					images: {
						'normal': [
							'images/cat.png',
							'images/cat_normal.png'
						],
						'attack': [
							'images/cat.png',
							'images/cat_attack.png'
						]
					},
					BloodBar: $("#blood1"),
					data: configs.bossList[1]
				}
				var cat = new _W.Sprite('boss1', catConfigs);
				cat.normal();

				var dogConfigs = {
					images: {
						'normal': [
							'images/dog.png',
							'images/dog.png'
						],
						'attack': [
							'images/dog.png',
							'images/dog_attack.png'
						]
					},
					BloodBar: $("#blood2"),
					data: configs.bossList[2]
				}
				var dog = new _W.Sprite('boss2', dogConfigs);
				dog.normal();
				activeBoss = [null, cat, dog];
			},
			leave: function(data) {
				var battle = $("#stage").find('#battle');
				$("#templates").append(battle);
			}
		},
		'gameover': {
			enter: function(data) {
				var gameover = $("#templates").find('#gameover');
				$("#stage").append(gameover);
			},
			leave: function(data) {
				var gameover = $("#stage").find('#gameover');
				$("#templates").append(gameover);
			}
		}
	};
	stateChecker = new _W.StateTranser(states); //定义一个场景转换器
	stateChecker.toState('intro');

	//与服务器通讯
	socket.on('sa-connected', function(data) {
		var joinCount = $("#join-count");
		configs.maxPlayers = data.max_players;
		configs.bossList = data.boss_list;
		joinCount.html(data.total + '/' + configs.maxPlayers);
		if (data.total >= configs.maxPlayers) {
			stateChecker.toState('ready');
		}
	});
	socket.on('sa-user-join', function(data) {
		var d = data.data;
		playerList.push(d);
		$("#join-count").html(d.total + '/' + configs.maxPlayers);
		if (d.total >= configs.maxPlayers) {
			stateChecker.toState('ready');
		}
	});
	socket.on('sa-user-leave', function(data) {
		var d = data.data;
		for (var i = 0; i < playerList.length; i++) {
			if (playerList[i].userid === d.userid) {
				playerList.splice(i, 1);
				break;
			}
		}
		$("#join-count").html(d.total + '/' + configs.maxPlayers);
	});
	socket.on('sa-new-shape', function(data) {
		var d = data.data;
		if (cards) cards.insert(d);
	});
	socket.on('sa-rm-shape', function(data) {
		var d = data.data;
		var card;
		if (cards) card = cards.destroy(d.shape.id);
		var r = d.attack_result;
		if (r) {
			//攻击消耗
			var enemy = activeBoss[parseInt(r.player.enemy)];
			var self = activeBoss[parseInt(r.player.hero)];
			self.attack();
			var enemycontainer = enemy.container;
			var selfcontainer = self.container;
			enemy.configs.data.hp = r.boss_status.hp;
			enemy.configs.BloodBar.css({
				'width': enemy.configs.data.hp / enemy.configs.data.max_hp * 330
			});
			card.css({
				zIndex: 2,
				top: 300,
				opacity: 1,
				left: selfcontainer.css('left'),
				right: selfcontainer.css('right')
			});
			$("#battle").append(card);
			if (card.css('left') !== 'auto') {
				card.stop().animate({
					'left': 1300,
				}, function() {
					card.remove();
				})
			} else {
				card.css('right', 100);
				card.stop().animate({
					'right': 1300,
				}, function() {
					card.remove();
				})
			}
		} else {
			//自然消亡
		}
	});
	socket.on('sa-gameover', function(data) {
		var d = data.data;
		console.log(d);
		stateChecker.toState('gameover');
		if (d.loser.name === '哮天犬') {
			$("#win-img").attr("src", winnerImages[0]);
		} else {
			$("#win-img").attr("src", winnerImages[1]);
		}
	});
});