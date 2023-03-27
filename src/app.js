var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

var gameStart = true;		//initiate all start elements in update
var images = {}; 			//Loaded images
var teams = [];				//each team has players
var bullets = [];			//all bullets currently needed to be drawn
var pressedKeys = {};		
var mouseP = [0, 0];		//mouse position
var pressedCameraP = [0, 0];//Camera position when the mouse is pressed
var pressedMouseP = [0, 0]; //mouse position when mouse is pressed
var mousePressedC = false;	//set to true when the mouse is first pressed
var mouseDown = false;		//if the mouse is currently pressed
var gravity = [0.0, 500.0];			//gravity is 100 pixels per secound
var dt = 1/60;
var mapChange = true;
var zoomScale = 1;
var pixelMap = [];			//list of all pixels in the map
var bulletHitInfo = [];		//[[position, radius]];
var bGamestartTestDraw = true; //map test image
var gameState = 'startMenu'; //the current state of the game, 'startMenu', 'local1vs1', 'local2vs2', 'local4vs4'
var gameOver = false;
var newgame = 6;
var startMenu;
var gameOverMenu;
var playerSize = [13, 20];

//turn variables:
var playersTurn = [0, 0, 0];			//The player whose turn it is. [team, player, life in the start of the turn];
var teamsNextTurn = [0, 0]; //next player to have a turn for each team
var nextTurnTimer = 9999; //secounds til next turn


//camera Variables
var cameraPos = [0, 0];		//top left canvas position on the map
var cameraVel = [0, 0];		//camera velocity
var cameraEndPos = [0, 0];	//cameras end position
var cameraMoving = false;
var cameraScaleStart = 1;

//Main canvas
var canvas = document.getElementById('maincanvas');
var context = canvas.getContext('2d');
var width = window.innerWidth-20;
if (width > 1024) {
	width = 1024;
}
var height = Math.round(width/4 * 3);
context.canvas.width  = width;
context.canvas.height = height;

//pixel info canvas for background comparison
var pixelCanvas;
var pixelContext;





var lastTime;
//Main loop
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;
    render();
	update(dt);
    lastTime = now;
    requestAnimFrame(main);
};


function render() {
	if(gameState == 'game') {
		if(newgame > 0) {
			context.save();
			context.scale(zoomScale,zoomScale);
			recompositCanvases()
			for(team in teams) {
				for(player in teams[team]) {
					if(team == playersTurn[0] && player == playersTurn[1]) {
						teams[team][player].render(context, true);
					} else {
						teams[team][player].render(context, false);
					}
				}
			}
			for(bullet in bullets) {
				bullets[bullet].render(context);
			}
			context.restore();
		}
	} else if(gameState == 'startMenu') {
		if(!gameStart) {
			startMenu.render(context);
		}
	} else if(gameState == 'gameOver') {
		if(!gameOverMenu) {
			gameOverMenu = new GameOverMenu();
		}
		gameOverMenu.render(context);
	}
};

function update(dt) {
	if(gameState == 'game' ) {
		if(newgame == 0) {
			drawCanvas.temp = document.createElement('canvas');
			drawCanvas.draw = document.createElement('canvas');
			drawCanvas.test = document.createElement('canvas');
			drawCanvas.ui = document.createElement('canvas');
			drawCanvas.ui.width = canvas.width;
			drawCanvas.ui.height = canvas.height;
			drawCanvas.temp.width = drawCanvas.draw.width = drawCanvas.test.width = currentMap.size[0];
			drawCanvas.temp.height = drawCanvas.draw.height = drawCanvas.test.height = currentMap.size[1];
			
			pixelCanvas = document.createElement('canvas');
			pixelCanvas.width = currentMap.size[0];
			pixelCanvas.height = currentMap.size[1];
			pixelContext = pixelCanvas.getContext('2d');

			recompositCanvases();
			cameraEndPos = [teams[playersTurn[0]][playersTurn[1]].position[0] - (canvas.width/zoomScale)/2, teams[playersTurn[0]][playersTurn[1]].position[1] - (canvas.height/zoomScale)/2];
			cameraMoving = true;
			newgame++
		} else if(newgame < 5) {
			newgame++;
		} else if(newgame == 5) {
			//turn change
			if(nextTurnTimer != 9999) {
				if(nextTurnTimer < 0) {
					if(playersTurn[0] == 1) {
						for(p = teamsNextTurn[0] + 1; p < teams[0].length + teamsNextTurn[0]; p++) {
							if(p >= teams[0].length) {
								pm = p-teams[0].length;
							} else {
								pm = p;
							}
							if(teams[0][pm].life > 0) {
								teamsNextTurn[0] = pm;
								break;
							}
						}
						playersTurn = [0, teamsNextTurn[0], teams[0][teamsNextTurn[0]].life];
						teams[playersTurn[0]][playersTurn[1]].shotFired = false;
						teams[playersTurn[0]][playersTurn[1]].playerEngaged = false;
					} else {
						for(p = teamsNextTurn[1]+1; p < teams[1].length + teamsNextTurn[1]; p++) {
							if(p >= teams[1].length) {
								pm = p-teams[1].length;
							} else {
								pm = p;
							}
							if(teams[1][pm].life > 0) {
								teamsNextTurn[1] = pm;
								break;
							}
						}
						playersTurn = [1,teamsNextTurn[1], teams[1][teamsNextTurn[1]].life];
						teams[playersTurn[0]][playersTurn[1]].shotFired = false;
						teams[playersTurn[0]][playersTurn[1]].playerEngaged = false;
					}
					cameraMoving = true;
					cameraEndPos = [teams[playersTurn[0]][playersTurn[1]].position[0] - (context.canvas.width / zoomScale) / 2, teams[playersTurn[0]][playersTurn[1]].position[1] - (context.canvas.height / zoomScale) / 2];
					cameraScaleStart = zoomScale;
					nextTurnTimer = 9999;
				} else if(bullets.length == 0){
					nextTurnTimer = nextTurnTimer - dt;
				}
			}
			if(mousePressedC) {
				var mouseHandled = true;
			}
			for(team in teams) {
				for(player in teams[team]) {
					if(team == playersTurn[0] && player == playersTurn[1]) {
						teams[team][player].update(dt, true);
					} else {
						teams[team][player].update(dt, false);
					}
				}
			}
			bulletRemoval = [];
			for(bullet in bullets) {
				bullets[bullet].update(dt)
				if(bullets[bullet].deleteB) {
					bulletRemoval[bulletRemoval.length] = bullet
				}
			}
			for(i = bulletRemoval.length-1; i >= 0; i--) {
				bullets.splice(bulletRemoval[i],1);
			}
			//camera handeling
			if(cameraMoving && !mouseDown && cameraScaleStart == zoomScale) {
				if(cameraEndPos[0] < 0) {
					cameraEndPos[0] = 0;
				}
				if(cameraEndPos[1] < 0) {
					cameraEndPos[1] = 0;
				}
				if(cameraEndPos[0] > currentMap.size[0] - context.canvas.width / zoomScale) {
					cameraEndPos[0] = currentMap.size[0] - context.canvas.width / zoomScale;
				}
				if(cameraEndPos[1] > currentMap.size[1] - context.canvas.height / zoomScale) {
					cameraEndPos[1] = currentMap.size[1] - context.canvas.height / zoomScale;
				}
				if(cameraVel[0] == 0 && cameraVel[1] == 0) {
					cameraVel[0] = (cameraEndPos[0] - cameraPos[0])/0.5;
					cameraVel[1] = (cameraEndPos[1] - cameraPos[1])/0.5;
				}
				if(Math.sqrt(Math.pow(cameraEndPos[0]-cameraPos[0], 2) + Math.pow(cameraEndPos[1] - cameraPos[1], 2)) < Math.sqrt(Math.pow(cameraVel[0] * dt,2) + Math.pow(cameraVel[1] * dt,2))) {
					//cameraPos = cameraEndPos.slice(0,2);
					cameraMoving = false;
					cameraVel = [0, 0];
				} else {
					cameraPos = [cameraPos[0] + cameraVel[0] * dt, cameraPos[1] + cameraVel[1] * dt];
				}
			} else {
				cameraVel = [0, 0];
				cameraEndPos = [0, 0];
				cameraMoving = false;
			}
			var playerHandler = teams[playersTurn[0]][playersTurn[1]].mouseHandler();
			if (mouseDown && playerHandler) {
				if (pressedMouseP[0] !== mouseP || pressedMouseP[1] !== mouseP[1]) {
					cameraPos = [(pressedCameraP[0] + (pressedMouseP[0] - mouseP[0])),
								 (pressedCameraP[1] + (pressedMouseP[1] - mouseP[1]))];
				}
				if (cameraPos[0] < 0) {
					cameraPos[0] = 0;
				} if (cameraPos[0] > currentMap.size[0] - Math.round(context.canvas.width/zoomScale)) {
					cameraPos[0] = currentMap.size[0]-  Math.round(context.canvas.width/zoomScale);
				} if (cameraPos[1] < 0) {
					cameraPos[1] = 0;
				} if (cameraPos[1] > currentMap.size[1] - Math.round(context.canvas.height/zoomScale)) {
					cameraPos[1] = currentMap.size[1] - Math.round(context.canvas.height/zoomScale);
				}
			}
			if(mouseHandled) {
				mouseHandled = false;
				mousePressedC = false;
			}
			//game end conditions
			teamsAlive = [];
			for(team in teams) {
				playerAlive = false;
				for(player in teams[team]) {
					if(teams[team][player].life > 0) {
						playerAlive = true
					}	
				}
				if(playerAlive) {
					teamsAlive[team] = true;
				} else {
					teamsAlive[team] = false;
				}
			}
			nrTeamsAlive = 0;
			for(team in teamsAlive) {
				if(teamsAlive[team]) {
					nrTeamsAlive++;
				}
			}
			if(nrTeamsAlive == 1) {
				gameOver = true;
				gameState = 'gameOver';
			}
		}
	} else if(gameState == 'startMenu') {
		if(gameStart) {
			startMenu = new Menu();
			gameStart = false;
		}
		zoomScale = 1;
		startMenu.update(dt);
	} else if(gameState == 'gameOver') {
		gameOverMenu.update(dt);
	}

	mousePressedC = false;
};














//if true it is a map part, if false there is nothing
function checkPixel(x, y) {
	if(x <= 0 || x >= currentMap.size[0] || y >= currentMap.size[1]-1) {
		return false;
	}
	return pixelMap[Math.round(y) * currentMap.size[0] + Math.round(x)];
}


function checkPixels(posx, posy, size) {
	if(posx < 0 || posx > currentMap.size[0] || posy >= currentMap.size[1]-1) {
		return false;
	}
	for(y = posy; y < size[1] + posy; y++) {
		for(x = posx; x < size[0] + posx; x++) {
			if (pixelMap[y * currentMap.size[0] + x])  {
				return true;
			}
		}
	}
	return false;
}


function pixelInfo(posx, posy, size) {
	var pixelInfos = [];
	posx = Math.round(posx);
	posy = Math.round(posy);
	for(y = posy; y < size[1] + posy; y++) {
		for(x = posx; x < size[0] + posx; x++) {
			if(x < 0 || x > currentMap.size[0] || y >= currentMap.size[1]-1) {
				pixelInfos[pixelInfos.length] = false;
			} else {
				pixelInfos[pixelInfos.length] = pixelMap[y * currentMap.size[0] + x];
			}
		}
	}
	return pixelInfos;
}


function mapPixelInfo(posx, posy, size) {
	var backgroundColor = pixelContext.getImageData(posx, posy, size[0], size[1]).data;
	var tmpctx = drawCanvas.test.getContext('2d');
	var frontColor = tmpctx.getImageData(posx, posy, size[0], size[1]).data;
	var pixelInfos = [];
	for(y = 0; y < size[1]; y++) {
		for(x = 0; x < size[0]; x++) {
			pixelInfos[pixelInfos.length] = (frontColor[(size[0] * y + x) * 4] != backgroundColor[(size[0] * y + x) * 4] || 
				frontColor[(size[0] * y + x) * 4 + 1] != backgroundColor[(size[0] * y + x) * 4 + 1] || 
				frontColor[(size[0] * y + x) * 4 + 2] != backgroundColor[(size[0] * y + x) * 4 + 2]);
		}
	}
	return pixelInfos;
}

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined" ) {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }        
}

function drawCrater(x, y, size) {
	ctx = drawCanvas.draw.getContext('2d');
	ctx.lineWidth = size;
	ctx.lineCap = ctx.lineJoin = 'round';
	ctx.strokeStyle = '#f00'; // can be any opaque color
	ctx.beginPath();
	ctx.moveTo(x + 0.01, y);
	ctx.lineTo(x, y);
	ctx.stroke();
	mapChange = true;
};


var Map = function(mapSprite, skySprite, size, possibleLocations) {
	this.mapSprite = mapSprite;
	this.skySprite = skySprite;
	this.size = size;
	this.posL = possibleLocations;
};

function newgameClear() {
	teams = [];
	playersTurn = [0, 0];
	teamsNextTurn = [0, 0];
	
	cameraPos = [0, 0];		//top left canvas position on the map
	cameraVel = [0, 0];		//camera velocity
	cameraEndPos = [0, 0];	//cameras end position
	cameraMoving = false;
	cameraScaleStart = 1;
	zoomScale = 1;
	pixelMap = [];
	mapChange = true;
	if(pixelContext) {
		pixelContext.clearRect(0, 0, currentMap.size[0], currentMap.size[1])
		testctx = drawCanvas.test.getContext('2d');
		testctx.clearRect(0, 0, currentMap.size[0], currentMap.size[1]);
	}
	bGamestartTestDraw = true;
}






var drawCanvas = {'temp':null, 'draw':null, 'test':null, 'ui':null}; // temp and draw canvases


//Image loading
var sources = {
	//Maps
    grasMap: 		'/Art/Maps/grasMap.png',
    grasMapSky: 	'/Art/Maps/grasMapSky.png',
	anthilMap:		'/Art/Maps/anthilMap.png',
	anthilMapSky:	'/Art/Maps/anthilMap_sky.png',
	anthilMap2000:	'/Art/Maps/anthilMap2000.png',
	anthilMap2000sky:'/Art/Maps/anthilMap2000sky.png',
	floadingIsland:	'/Art/Maps/floadingIsland.png',
	floadingIslandSky:'/Art/Maps/floadingIslandSky.png',
	bullet: 		'/Art/old/bullet.png',
	Man1: 			'/Art/old/Man1.png',
	spaceMan:		'/Art/SpaceMan/spacemanSS.png',
	spaceManRed:	'/Art/SpaceMan/spacemanSSred.png',
	bazooka:		'/Art/Weapons/bazooka.png',
	bazookaRound:	'/Art/Weapons/bazookaRound.png',
	local1vs1:		'/Art/Menu/local1vs1.png',
	local2vs2:		'/Art/Menu/local2vs2.png',
	local4vs4:		'/Art/Menu/local4vs4.png',
	arrow:			'/Art/old/arrow.png'
};

//Updates the current canvas with what ever is drawn on drawCanvas
function recompositCanvases() {
	var tempctx = drawCanvas.temp.getContext('2d');
	var mainctx = canvas.getContext('2d');
	var testctx = drawCanvas.test.getContext('2d');
	
	mainctx.drawImage(	currentMap.skySprite, Math.round(cameraPos[0]), Math.round(cameraPos[1]), Math.round(context.canvas.width/zoomScale), Math.round(context.canvas.height/zoomScale),
						0, 0, Math.round(context.canvas.width/zoomScale), Math.round(context.canvas.height/zoomScale));
	mainctx.drawImage(	currentMap.mapSprite, Math.round(cameraPos[0]), Math.round(cameraPos[1]), Math.round(context.canvas.width/zoomScale), Math.round(context.canvas.height/zoomScale),
						0, 0, Math.round(context.canvas.width/zoomScale), Math.round(context.canvas.height/zoomScale));

	mainctx.drawImage(drawCanvas.temp, Math.round(cameraPos[0]), Math.round(cameraPos[1]), Math.round(context.canvas.width/zoomScale), Math.round(context.canvas.height/zoomScale),
						0, 0, Math.round(context.canvas.width/zoomScale), Math.round(context.canvas.height/zoomScale));
						
	// Pixel check full size canvas (with everything)
	if(mapChange) {
		tempctx.save();
		tempctx.drawImage(drawCanvas.draw, 0, 0);
		tempctx.globalCompositeOperation = 'source-atop';
		tempctx.drawImage(currentMap.skySprite, 0, 0);
		tempctx.restore();
		if(bGamestartTestDraw) {
			testctx.drawImage(	currentMap.skySprite, 0, 0);
			testctx.drawImage(	currentMap.mapSprite, 0, 0);
			bGamestartTestDraw = false;
		}
		testctx.drawImage(drawCanvas.temp, 0, 0);
						
		// Pixel check canvas
		pixelContext.drawImage(currentMap.skySprite, 0, 0);
		if(bulletHitInfo.length != 0) {
			for(hit in bulletHitInfo) {
				pixelMapChange = mapPixelInfo(Math.round(bulletHitInfo[hit][0][0] - bulletHitInfo[hit][1]), Math.round(bulletHitInfo[hit][0][1] - bulletHitInfo[hit][1]), [bulletHitInfo[hit][1]*2, bulletHitInfo[hit][1]*2]);
				var count = 0;
				for(y = Math.round(bulletHitInfo[hit][0][1] - bulletHitInfo[hit][1]); y < Math.round(bulletHitInfo[hit][0][1] + bulletHitInfo[hit][1]); y++) {
					for(x = Math.round(bulletHitInfo[hit][0][0] - bulletHitInfo[hit][1]); x < Math.round(bulletHitInfo[hit][0][0] + bulletHitInfo[hit][1]); x++) {
						if(!pixelMapChange[count] && pixelMap[Math.round(y*currentMap.size[0] + x)] && y <= currentMap.size[1]) {
							pixelMap[Math.round(y*currentMap.size[0] + x)] = pixelMapChange[count];
						}
						count++;
					}
				}
			}
		}
		bulletHitInfo = [];
		mapChange = false;
	}
	//pixelMap creation:
	if(pixelMap.length == 0) {
		pixelMap = mapPixelInfo(0, 0, [currentMap.size[0], currentMap.size[1]]);
	}
	
}

function getLocalCoords(elem, ev) {
	var ox = 0, oy = 0;
	var first;
	var pageX, pageY;

	// Walk back up the tree to calculate the total page offset of the
	// currentTarget element.  I can't tell you how happy this makes me.
	// Really.
	while (elem != null) {
		ox += elem.offsetLeft;
		oy += elem.offsetTop;
		elem = elem.offsetParent;
	}

	if (ev.hasOwnProperty('changedTouches')) {
		first = ev.changedTouches[0];
		pageX = first.pageX;
		pageY = first.pageY;
	} else {
		pageX = ev.pageX;
		pageY = ev.pageY;
	}

	return { 'x': pageX - ox, 'y': pageY - oy };
}
loadImages(sources, function() {
	function mousedown_handler(e) {
		var local = getMousePos(canvas, e);
		mouseDown = true;
		mousePressedC = true;
		mouseP = [local.x/zoomScale, local.y/zoomScale];
		pressedMouseP = [local.x/zoomScale, local.y/zoomScale];
		pressedCameraP = cameraPos;

		if (e.cancelable) { e.preventDefault(); } 
		return false;
	};
	function mousemove_handler(e) {
		var local = getMousePos(canvas, e);
		if (!mouseDown) { 
			mouseP = [local.x/zoomScale, local.y/zoomScale];
			return true; 
		}
		mouseP = [local.x/zoomScale, local.y/zoomScale];
		if (e.cancelable) { e.preventDefault(); } 
		return false;
	};
	function zoom(e) {
		var local = getMousePos(canvas, e);
		if(local.x > 0 && local.x < canvas.width && local.y > 0 && local.y < canvas.height && gameState == 'game') {
			e.preventDefault();
			if((e.detail > 0 || e.wheelDelta < 0)&& context.canvas.width/(zoomScale-0.05) < currentMap.size[0] && context.canvas.height/(zoomScale-0.05) < currentMap.size[1]) {
				zoomScale = zoomScale-0.05;
				if (cameraPos[0] + canvas.width/zoomScale > currentMap.size[0] && cameraPos[1] + canvas.height/zoomScale > currentMap.size[1]){
					cameraPos[0] = currentMap.size[0] - canvas.width/zoomScale;
					cameraPos[1] = currentMap.size[1] - canvas.height/zoomScale;
				}else if(cameraPos[0] + canvas.width/zoomScale > currentMap.size[0] && cameraPos[1] - mouseP[1]/zoomScale*0.05 > 0){
					cameraPos[0] = currentMap.size[0] - canvas.width/zoomScale;
					cameraPos[1] = cameraPos[1] - mouseP[1]/zoomScale*0.05;
				}else if(cameraPos[0] + canvas.width/zoomScale > currentMap.size[0]){
					cameraPos[0] = currentMap.size[0] - canvas.width/zoomScale;
				}
				else if(cameraPos[1] + canvas.height/zoomScale > currentMap.size[1] && cameraPos[0] - mouseP[0]/zoomScale*0.05 > 0){
					cameraPos[1] = currentMap.size[1] - canvas.height/zoomScale;
					cameraPos[0] = cameraPos[0] - mouseP[0]/zoomScale*0.05;
				}else if(cameraPos[1] + canvas.height/zoomScale > currentMap.size[1]){
					cameraPos[1] = currentMap.size[1] - canvas.height/zoomScale;
				}
				else if(cameraPos[0] - mouseP[0]/zoomScale*0.05 > 0 && cameraPos[1] - mouseP[1]/zoomScale*0.05 > 0) {
					cameraPos[0] = cameraPos[0] - mouseP[0]/zoomScale*0.05;
					cameraPos[1] = cameraPos[1] - mouseP[1]/zoomScale*0.05;
				}
			} else if ((e.detail < 0 || e.wheelDelta > 0 )&& zoomScale < 3) {
				zoomScale = zoomScale + 0.05;
				cameraPos[0] = cameraPos[0] + mouseP[0]/zoomScale*0.05;
				cameraPos[1] = cameraPos[1] + mouseP[1]/zoomScale*0.05;
			}
		}
	};


	/**
	 * On mouseup.  (Listens on window to catch out-of-canvas events.)
	 */
	function mouseup_handler(e) {
		if (mouseDown) {
			mouseDown = false;
			if (e.cancelable) { e.preventDefault(); } 
			return false;
		}

		return true;
	};
	
	//multiplayer event handlers
	
	canvas.addEventListener('mousedown', mousedown_handler, false);
	canvas.addEventListener('touchstart', mousedown_handler, false);

	canvas.addEventListener('mousemove', mousemove_handler, false);
	canvas.addEventListener('touchmove', mousemove_handler, false);
	
	window.addEventListener('mouseup', mouseup_handler, false);
	window.addEventListener('touchend', mouseup_handler, false);
	
	window.addEventListener('keydown', function(e) {
        setKey(e, true);
    });
	
	window.addEventListener("DOMMouseScroll", zoom, false);
	window.addEventListener('mousewheel', zoom, false);

    window.addEventListener('keyup', function(e) {
        setKey(e, false);
    });

    window.addEventListener('blur', function() {
        pressedKeys = {};
    });
	
    main();
	}
);

function loadImages(sources, callback) {
    var loadedImages = 0;
    var numImages = 0;
    // get num of sources
    for(var src in sources) {
        numImages++;
    }
    for(var src in sources) {
        images[src] = new Image();
        images[src].onload = function() {
            if(++loadedImages >= numImages) {
                callback(images);
            }
        };
        images[src].src = sources[src];
    }
}

//Input handeling


function setKey(event, status) {
    var code = event.keyCode;
    var key;

    switch(code) {
		case 32:
            key = 'SPACE'; break;
        case 37:
            key = 'LEFT'; break;
        case 38:
            key = 'UP'; break;
        case 39:
            key = 'RIGHT'; break;
        case 40:
            key = 'DOWN'; break;
        default:
            // Convert ASCII codes to letters
            key = String.fromCharCode(code);
    }
	if(key == 'W') {
		pressedKeys['UP'] = status;
	} else if(key == 'D') {
		pressedKeys['RIGHT'] = status;
	} else if(key == 'A') {
		pressedKeys['LEFT'] = status;
	} else {
    pressedKeys[key] = status;
	}
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
    };
}

