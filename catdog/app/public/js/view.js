var View = window.View = window._W = {};
var CardBar = _W.CardBar = function(target) {
	this.init(target);
};
CardBar.prototype.init = function(target) {
	var container = $('#' + target);
	this.container = container || null;
	this.shapeImags  = [
		"",
		"images/circle.png",
		"images/J.png",
		"images/M.png",
		"images/rect.png",
		"images/S.png",
		"images/tri.png",
		"images/U.png"
	]; 
};
CardBar.prototype.insert = function(d) {
	var container = this.container;
	var shapeImags = this.shapeImags;
	var item = $('<div class="card" data-id="' + d.shape.id + '"><img src="' + shapeImags[d.shape.type] + '"/></div>');
	container.prepend(item);
	item.animate({
		left: 800
	}, 10000);
};
CardBar.prototype.destroy = function(id) {
	var card = this.container.find('.card[data-id="' + id + '"]');
	return card.remove();
};

//场景切换器
var StateTranser = _W.StateTranser = function(stateList) {
	this.init(stateList);
};
StateTranser.prototype.init = function(stateList, curState) {
	this.states = stateList || {};
	this.curState = curState;
	if (curState) this.toState(curState);
}
StateTranser.prototype.toState = function(key, data) {
	var states = this.states;
	states[this.curState] && states[this.curState].leave();
	this.curState = key;
	states[this.curState] && states[this.curState].enter(data);
}
//BOSS精灵
// var configSample = {
// 	images: {
// 		'normal': [
// 			'images/cat.png',
// 			'images/cat_normal.png'
// 		],
// 		'attack': [
// 			'images/cat.png',
// 			'images/cat_attack.png'
// 		]
// 	}
// }
var Sprite = _W.Sprite = function(target, configs) {
	this.init(target, configs);
};
Sprite.prototype.init = function(target, configs) {
	this.container = $('#' + target);
	this.configs = configs;
	this.animate = null;
};
//移动
Sprite.prototype.normal = function() {
	window.clearInterval(this.animate);
	var container = this.container;
	var configs = this.configs;
	var images = configs.images["normal"];
	var curImg = 0;
	var img = container.find('img');
	this.animate = setInterval(function() {
		curImg = (++curImg) % images.length;
		img.attr('src', images[curImg]);
		if (container.css('top') === '240px') {
			container.stop().animate({
				top: '220px'
			}, 900)
		} else {
			container.stop().animate({
				top: '240px'
			}, 900)
		}
	}, 1000);
};
//攻击
Sprite.prototype.attack = function(target) {
	window.clearInterval(this.animate);
	var container = this.container;
	var configs = this.configs;
	var images = configs.images["attack"];
	var curImg = 0;
	var img = container.find('img');
	var count = 0;
	this.animate = setInterval(function() {
		curImg = (++curImg) % images.length;
		img.attr('src', images[curImg]);
		if (container.css('top') === '240px') {
			container.animate({
				top: '220px'
			}, 900)
		} else {
			container.animate({
				top: '240px'
			}, 900)
		}
	}, 1000);
}