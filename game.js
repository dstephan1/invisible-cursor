
GameState = {
	UNINITIALIZED: 0,
	START : 1,
	PLAY : 2,
	FINISH : 3
}

var center;
var center_textbox;
var stats_textbox;
var stats_textbox2;
var canvas;
var ctx;
var width, height;

var state = GameState.UNINITIALIZED;
var clicks = 0;
var time_elapsed_sec = 0;

var last_click_sec = 0;
var last_click_x = 0;
var last_click_y = 0;

var timeout_sec;
var prev_t_msec; // used for calculating dt, microseconds

var music;
var player;

Target = {
	"x" : 0,
	"y" : 0, 
	"radius" : 40,
	"fadein": 0 // TODO
}
var targets = [];

// parameters
// var circle_radius_min = 50;
// var circle_radius_max = 100;
// var num_targets = 3;
// var spawn_width = 600;
// var spawn_height = 500;
// var hint_radius = 10;

parameters = {
	'circle_radius_min' : {
		'min' : 1,
		'max' : 500,
		'default' : 50
	},
	'circle_radius_max' : {
		'min' : 1,
		'max' : 500,
		'default' : 100
	},
	'num_targets' : {
		'min' : 1,
		'max' : 40,
		'default' : 3
	},
	'spawn_width' : {
		'min' : 0,
		'max' : 800,
		'default' : 640
	},
	'spawn_height' : {
		'min' : 0,
		'max' : 600,
		'default' : 480
	},
	'hint_radius' : {
		'min' : 0,
		'max' : 500,
		'default' : 10
	}
}
var params; // gets loaded later


window.onload = function() {
	console.log("おはいよう");
	// copy paste google's youtube api tutorial
	var tag = document.createElement('script');

	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	// text stuff
	center = document.getElementById("canvas-container");
	center_textbox = document.getElementById("center-textbox");
	stats_textbox = document.getElementById("stats-textbox");
	stats_textbox2 = document.getElementById("stats-textbox2");

	// canvas stuff
	canvas = document.getElementById("game-canvas");
	ctx = canvas.getContext('2d');
	width = canvas.width;
	height = canvas.height;

	// click tracking
	center.addEventListener("mousedown",onClick);
	center.oncontextmenu = function(){return false;};

	// delta time
	prev_t_msec = window.performance.now();
	
	// music = new Audio("assets/music.mp3");
	// music.loop = true;

	// parameter initialization
	params = paramsGenerate(document.getElementById("params-box"), parameters);
	//console.log("new params", params);
	
	doStart();
	frame();
}

function onPlayerReady(event) {
  //event.target.playVideo();
}
function onPlayerStateChange(event) {
  //console.log("some state change?", event.data);
}
function onYouTubeIframeAPIReady() {
	console.log("youtube state", YT);
	player = new YT.Player('music-player', {
		height: '390',
		width: '640',
		playerVars: {
			listType: 'playlist',
			list: 'PLyQlSCvBJsly9gDjXX2BPkqYf2x37ySu7'
		},
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

function addTarget() {
	var new_target = {};
	
	var spawn_width = params.spawn_width.value;
	var spawn_height = params.spawn_height.value;
	var circle_radius_min = params.circle_radius_min.value;
	var circle_radius_max = params.circle_radius_max.value;
	if (circle_radius_max < circle_radius_min) {
		circle_radius_max = circle_radius_min;
	}
	
	// how to randomly generate with respect to the center
	new_target["x"] = Math.random()*spawn_width + (width - spawn_width)/2;
	new_target["y"] = Math.random()*spawn_height + (height - spawn_height)/2;
	new_target["radius"] = Math.random()*(circle_radius_max - circle_radius_min) + circle_radius_min;
	new_target["fadein"] = 0;
	
	//console.log("new target", new_target);
	targets.push(new_target);
}
function updateStats1() {
	stats_textbox.innerHTML = 
	 "<p>time : " + time_elapsed_sec.toFixed(1) + "</p>" 
	 + "<p>hits : " + clicks + "</p>"
}
function updateStats2() {
	//Stats
	//  total hits
	//  bullseye hits
	//  average distance from center
	//  hits per second
	//  average latency
	output = {
	"hits" : clicks,
	"seconds elapsed" : time_elapsed_sec.toFixed(1),
	"hits/sec" : (clicks/time_elapsed_sec).toFixed(2)
	}

	stats_textbox2.innerHTML = "<p>last stats</p>"
	for (key in output) {
		stats_textbox2.innerHTML += "<p>" + key + " : " + output[key] + "</p>";
	}
}

// state transitions
function doStart() {
	center_textbox.innerHTML="CLICK TO START";
	state = GameState.START;
	if (player && player.pauseVideo) player.pauseVideo();
}
function doPlay() {
	center_textbox.style.display = 'block';
	clicks = 0;
	time_elapsed_sec = 0;
	last_click_sec = -10;
	var last_clicked = 0;
	state = GameState.PLAY;
	targets = [];
	
	//music.play();
	
	if (player && player.playVideo) player.playVideo();
	
	
	for(var i=0; i<params.num_targets.value; i++){
		addTarget();
	}
}
function doFinish() {
	center_textbox.style.display = 'block';
	center.style.cursor = 'auto';
	center_textbox.innerHTML="CLICK TO RETRY";
	state = GameState.FINISH;
	if (player && player.pauseVideo) player.pauseVideo();
	
	stats_textbox.innerHTML = "";
	updateStats2();

}

function onClick(e) {
	e.preventDefault(); // disables that double click selection thing
	//console.log("some clickin", e);
	//console.log(state);
	if (state == GameState.START || state == GameState.FINISH) {
		doPlay();
	}
	else if (state == GameState.PLAY) {
	
		//console.log("mouse", e.offsetX, e.offsetY);

		// scan for circle hits, oldest first
		for (var i = 0; i < targets.length; i++) {
			//console.log("target", i, targets[i]['x'], targets[i]['y'], targets[i]['radius']);
			// something something when the text box captures the mouse clicks we get messed up
			var rect = center.getBoundingClientRect();
			offsetY = e.clientY - rect.top;
			offsetX = e.clientX - rect.left;
			
			var hit = 
				(offsetX - targets[i]['x'])**2 
				+ (offsetY - targets[i]['y'])**2 
				<= targets[i]['radius']**2;
				
			if (hit) {
				var hitsound = new Audio('assets/hit.wav');
				hitsound.play();
				
				// remove the element
				targets.splice(i,1);
				
				last_click_sec = time_elapsed_sec;
				last_click_x = offsetX;
				last_click_y = offsetY;
				
				addTarget();
				clicks++;
				updateStats1();
				return;
			}
		}
	
		// no hits
		var misssound = new Audio('assets/miss.wav');
		misssound.play();
		doFinish();
		return;
	}
}

function frame() {
	ctx.clearRect(0, 0, width, height);
	//console.log("foo");

	// time stuff
	var t_msec = window.performance.now();
	var dt_msec = t_msec - prev_t_msec;
	prev_t_msec = t_msec;

	if (state == GameState.PLAY) {
		time_elapsed_sec += dt_msec / 1000;

		//ctx.fillStyle = 'rgb(180, 0, 0)';
		//ctx.fillRect(0, height-10, width, 10);
		//console.log(time_elapsed_sec);

		if (time_elapsed_sec < 1) {
			center_textbox.innerHTML = "3";
		}
		else if (time_elapsed_sec < 2) {
			center_textbox.innerHTML = "2";
		}
		else if (time_elapsed_sec < 3) {
			center_textbox.innerHTML = "1";
		}
		else {
			center_textbox.style.display = 'none';
			center.style.cursor = 'none';
		}
		updateStats1();

		// draw circles, in reverse order to copy Osu!
		// also bless stack overflow
		for (var i = targets.length - 1; i >= 0; i--) {
			ctx.beginPath();
			ctx.arc(targets[i]['x'], targets[i]['y'], targets[i]['radius'], 0, 2 * Math.PI, false);
			ctx.fillStyle = 'rgba(255, 0, 0, .8)';
			ctx.fill();
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#FFFFFF';
			ctx.stroke();
		}
		
		// draw sploosh
		if (time_elapsed_sec - last_click_sec <= .1) {
			ctx.beginPath();
			ctx.arc(last_click_x, last_click_y, params.hint_radius.value, 0, 2 * Math.PI, false);
			ctx.fillStyle = 'white';
			ctx.fill();
			ctx.lineWidth = 0;
			ctx.strokeStyle = '#FFFFFF';
			ctx.stroke();
		}

	}

	window.requestAnimationFrame(frame);
}