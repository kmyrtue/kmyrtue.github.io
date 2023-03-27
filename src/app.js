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


//multiplayer variables
var socket;



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

var GameOverMenu = function() {
	
}

GameOverMenu.prototype.render = function(ctx) {
	ctx.save();
	ctx.fillStyle = 'green';
	//ctx.lineWidth = 13;
	roundRect(ctx, canvas.width/4, canvas.height/4, canvas.width/2, canvas.height/2, 5, ctx.fill, ctx.stroke());
	ctx.restore();
}

GameOverMenu.prototype.update = function(dt) {
	if(mouseDown && mouseP[0] > canvas.width/4 && mouseP[0] < canvas.width/4*3 && mouseP[1] > canvas.height/4 && mouseP[1] < canvas.height/4*3 ){
		gameState = 'startMenu';
	}
}

var Menu = function() {
	this.menuItems = [['local1vs1', images.local1vs1, 0], ['local2vs2', images.local2vs2, context.canvas.width/2], ['local4vs4', images.local4vs4, context.canvas.width]];
	this.moveTo = 0;
	this.mousePressedPos = 0;
}

Menu.prototype.render = function(ctx) {
	context.save();
    context.beginPath();
    context.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
    context.fillStyle = 'black';
    context.fill();
    context.lineWidth = 7;
    context.strokeStyle = 'black';
    context.stroke();
	context.restore();
	for(menuItem in this.menuItems) {
		ctx.drawImage(this.menuItems[menuItem][1], 	Math.round(this.menuItems[menuItem][2]-ctx.canvas.height/6), Math.round(ctx.canvas.height/3), 
															Math.round(ctx.canvas.height/3), Math.round(ctx.canvas.height/3));
	}
	
}

Menu.prototype.update = function(dt) {
	if(mouseDown) {
		if(mousePressedC) {
			this.mousePressedPos = this.menuItems[0][2];
		}
		for(menuItem in this.menuItems) {
			if(pressedMouseP[0] < this.menuItems[menuItem][2] + context.canvas.height/6 && pressedMouseP[0] > this.menuItems[menuItem][2] - context.canvas.height/6 &&
					pressedMouseP[1] > context.canvas.height/3 && pressedMouseP[1] < 2*context.canvas.height/3 && mousePressedC &&
						(this.menuItems[menuItem][2] - context.canvas.width/2 < 10 && this.menuItems[menuItem][2] - context.canvas.width/2 > -10 )) {
				switch(this.menuItems[menuItem][0]) {
					case 'local1vs1':
						gameState = 'game';
							newgameClear();
							currentMap = new Map(images.anthilMap2000, images.anthilMap2000sky, [2000, 2000],[[924, 1738],[1233, 1843],[834, 1593],
																											  [506, 1467],[1210, 1175], [987, 1370], 
																											  [866, 1509],[1042, 1989], [293, 1961]]);
							teamLocation = shuffle(currentMap.posL);
							teams[0] = [new Player(teamLocation[0], images.spaceMan, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'sir Trylle' )];
							teams[0][0].weapons[0] = new Bazooka(20);
							teams[1] = [new Player(teamLocation[1], images.spaceManRed, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'blue' )];
							teams[1][0].weapons[0] = new Bazooka(20);
							newgame = 0;
							break;
					case 'local2vs2':
						gameState = 'game';
							newgameClear();
							currentMap = new Map(images.floadingIsland, images.floadingIslandSky, [2000, 2000],[[1315, 1354],[968, 1372],[529, 1224],
																											  [1811, 1427],[660, 670], [819, 917],
																											  [170, 1350]]);
							teamLocation = shuffle(currentMap.posL);
							teams[0] = [	new Player(teamLocation[0], images.spaceMan, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'useless Steve' ),
											new Player(teamLocation[1], images.spaceMan, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'genius Pinkie' )];
							teams[0][0].weapons[0] = new Bazooka(20);
							teams[0][1].weapons[0] = new Bazooka(20);
							teams[1] = [	new Player(teamLocation[2], images.spaceManRed, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'Monkey 1' ),
											new Player(teamLocation[3], images.spaceManRed, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'Monkey 2' )];
							teams[1][0].weapons[0] = new Bazooka(20);
							teams[1][1].weapons[0] = new Bazooka(20);
							newgame = 0;
						break;
					case 'local4vs4':
						gameState = 'game';
						newgameClear();
							currentMap = new Map(images.anthilMap2000, images.anthilMap2000sky, [2000, 2000],[[924, 1738],[1233, 1843],[834, 1593],
																											  [506, 1467],[1210, 1175], [987, 1370], 
																											  [866, 1509],[1042, 1989], [293, 1961]]);
							teamLocation = shuffle(currentMap.posL);
							teams[0] = [	new Player(teamLocation[0], images.spaceMan, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'Killer' ),
											new Player(teamLocation[1], images.spaceMan, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'Monster' ),
											new Player(teamLocation[2], images.spaceMan, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'Nightmare' ),
											new Player(teamLocation[3], images.spaceMan, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'Terror' )];
							teams[0][0].weapons[0] = new Bazooka(20);
							teams[0][1].weapons[0] = new Bazooka(20);
							teams[0][2].weapons[0] = new Bazooka(20);
							teams[0][3].weapons[0] = new Bazooka(20);
							teams[1] = [	new Player(teamLocation[4], images.spaceManRed, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'Unicorn Man!' ),
											new Player(teamLocation[5], images.spaceManRed, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'The Rainbow elf' ),
											new Player(teamLocation[6], images.spaceManRed, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'Alf the Elf' ),
											new Player(teamLocation[7], images.spaceManRed, [50.0,70.0], playerSize, 100, [0.0,0.0], 1, 'Bob' )];
							teams[1][0].weapons[0] = new Bazooka(20);
							teams[1][1].weapons[0] = new Bazooka(20);
							teams[1][2].weapons[0] = new Bazooka(20);
							teams[1][3].weapons[0] = new Bazooka(20);
							newgame = 0;
						break;
					default:
						console.log('default');
				}
				mouseDown = false;
			}
			else if(		pressedMouseP[0] < this.menuItems[menuItem][2] + context.canvas.height/6 && pressedMouseP[0] > this.menuItems[menuItem][2] - context.canvas.height/6 &&
					pressedMouseP[1] > context.canvas.height/3 && pressedMouseP[1] < 2*context.canvas.height/3 && mousePressedC) {
				this.moveTo = context.canvas.width/2 - this.menuItems[menuItem][2];
				mouseDown = false;
			} 
		}
		if(pressedMouseP[0] != mouseP[0] && mouseDown) {
			closest = 10000;
			for(menuItem in this.menuItems) {
				if(Math.abs(this.menuItems[menuItem][2] - context.canvas.width/2) < Math.abs(closest)) {
					closest = this.menuItems[menuItem][2] - context.canvas.width/2
				}
				this.menuItems[menuItem][2] = this.mousePressedPos + menuItem*(context.canvas.width/2) - pressedMouseP[0] + mouseP[0];
			}
			this.moveTo = -closest;
		}
	} else if(this.moveTo < -10 ) {
		for(menuItem in this.menuItems) {
			this.menuItems[menuItem][2] = this.menuItems[menuItem][2] - 7;
		}
		this.moveTo = this.moveTo + 7;
	} else if(this.moveTo > 10) {
		for(menuItem in this.menuItems) {
			this.menuItems[menuItem][2] = this.menuItems[menuItem][2] + 7;
		}
		this.moveTo = this.moveTo - 7;
	} else if( this.moveTo != 0) {
		frontMenuItem = -1
		closest = 10000;
		for(menuItem in this.menuItems) {
			if(Math.abs(this.menuItems[menuItem][2] - context.canvas.width/2) < Math.abs(closest)) {
				closest = this.menuItems[menuItem][2] - context.canvas.width/2;
				frontMenuItem = menuItem;
			}
			this.menuItems[menuItem][2] = this.mousePressedPos + menuItem*(context.canvas.width/2) - pressedMouseP[0] + mouseP[0];
		}
		this.moveTo = 0;
			for(menuItem in this.menuItems) {
				this.menuItems[menuItem][2] = context.canvas.width/2 * (menuItem - frontMenuItem + 1);
			}

	}
/* 	isZero = false;
	for(menuItem in this.menuItems) {
		if(this.menuItems[menuItem][2] == 0) {
			isZero = true;
		}
	}
	if(this.moveTo == 0 && !isZero) {
		closestToZero = 10000;
		for(menuItem in this.menuItems) {
			if(Math.abs(this.menuItems[menuItem][2]) < Math.abs(closestToZero)) {
				closestToZero = this.menuItems[menuItem][2];
			}
		}
		this.moveTo = -closestToZero;
	}	 */
}

var Projectile = function(sprite, spriteSize, size, dmg, expRadius, position, velocity, bulletPower) {
	this.sprite = sprite;
	this.spriteSize = spriteSize;
	this.size = size;
	this.dmg = dmg;
	this.expRadius = expRadius;
	this.position = position;
	this.velocity = velocity;
	this.bulletMoving = true;
	this.hitPosition = [0,0];
	this.bulletDir = 0;
	this.bulletDirection = false;
	this.tempOldPosition = [0,0];
	this.oldPosition = [0,0];
	this.hitPosition = [0,0];
	this.bulletPower = bulletPower;
	this.deleteB = false;
}

Projectile.prototype.render = function(ctx) {
	if(this.bulletMoving) {
		if(!this.bulletDirection) {
			ctx.save();
			ctx.translate(this.position[0]-cameraPos[0], this.position[1]-cameraPos[1]);
			ctx.rotate(this.bulletDir);
			ctx.drawImage(this.sprite, 0, 0, this.spriteSize[0], this.spriteSize[1], Math.round(-this.size[0]/2), Math.round(-this.size[0]/2), this.size[0], this.size[1]);
			ctx.restore();
		} else{
			ctx.save();
			ctx.translate(Math.round(this.position[0]-cameraPos[0]), Math.round(this.position[1]-cameraPos[1]));
			ctx.rotate(-this.bulletDir);
			ctx.scale(-1,1);
			ctx.drawImage(this.sprite, 0, 0, this.spriteSize[0], this.spriteSize[1], Math.round(-this.size[0]/2), Math.round(-this.size[0]/2), this.size[0], this.size[1]);
			ctx.restore();
		}
	} 
	if(this.hitPosition[0] != 0 || this.hitPosition[1] != 0) {
		drawCrater(this.position[0],this.position[1], 100);
		this.hitPosition = [0,0];
		this.deleteB = true;
	}
}

Projectile.prototype.update = function(dt) {
	if(this.bulletMoving) {
		this.position[0] = this.position[0] + this.velocity[0]*dt + 1/2*gravity[0]*Math.pow(dt,2);
		this.position[1] = this.position[1] + this.velocity[1]*dt + 1/2*gravity[1]*Math.pow(dt,2);
		this.velocity[1] = this.velocity[1] + gravity[1] * dt;
		this.setDir();
		this.setOP();
		var playerHit = false;
		for(team in teams) {
			for(player in teams[team]) {
				if (teams[team][player].position[0]-teams[team][player].size[0]/2 < this.position[0] && teams[team][player].position[0]+teams[team][player].size[0]/2 > this.position[0] &&
					teams[team][player].position[1]-teams[team][player].size[1] < this.position[1] && teams[team][player].position[1] > this.position[1]) {
					this.bulletMoving = false;
					this.hit();
					playerHit = true;
					break;
				}
			}
		}
		if(checkPixel(this.position[0],this.position[1]) && !playerHit){
			this.position = this.collision(	this.position, [(this.position[0] + (this.oldPosition[0]-this.position[0])/2), 
															(this.position[1] + (this.oldPosition[1]-this.position[1])/2)], 
											this.oldPosition,this.oldPosition);
			this.bulletMoving = false;
			this.hit();
		}
		if(this.position[0] < -50 || this.position[0] > currentMap.size[0] + 50 || this.position[1] > currentMap.size[1] + 50) {
			this.deleteB = true;
		}
	}
}

Projectile.prototype.setDir = function() {
	//set bullet direction:
	var a = this.velocity[0];
	var b = this.velocity[1];
	var c = Math.sqrt(Math.pow(a,2) + Math.pow(b,2));
	this.bulletDir = Math.asin(b/c);
	if(this.velocity[0] > 0) {
		this.bulletDirection = false;
	} else {
		this.bulletDirection = true;
	}
}

Projectile.prototype.setOP = function() {
	if(Math.sqrt(Math.pow((this.tempOldPosition[0]-this.position[0]),2) + Math.pow((this.tempOldPosition[1]-this.position[1]),2)) > 5){
		this.oldPosition = this.tempOldPosition.slice(0,2);
		this.tempOldPosition = this.position.slice(0,2);
	}
}

Projectile.prototype.collision = function(pos, cPos, oP, originalOP) {
	if(pos[0]-oP[0] > 1 || pos[1]-oP[1] > 1) {
		if(checkPixel(cPos[0],cPos[1])) {
			pos = cPos.slice(0,2);
			cPos[0] = cPos[0] + (oP[0] - cPos[0])/2;
			cPos[1] = cPos[1] + (oP[1] - cPos[1])/2;
			cPos = this.collision(pos, cPos, oP, originalOP);
		} else{
			oP = cPos.slice(0,2);
			cPos[0] = pos[0] + (cPos[0] - pos[0])/2;
			cPos[1] = pos[1] + (cPos[1] - pos[1])/2;
			cPos = this.collision(pos, cPos, oP,originalOP);
		}
	}
	return cPos;	
}

Projectile.prototype.hit = function() {
	
	this.hitPosition = this.position.slice(0,2);
	bulletHitInfo[bulletHitInfo.length] = [this.hitPosition, this.expRadius];
	teams[playersTurn[0]][playersTurn[1]].weaponDrawn = false;
	for(team in teams) {
		for(player in teams[team]) {
			if(Math.sqrt(Math.pow(teams[team][player].position[0] - this.position[0],2) + Math.pow(teams[team][player].position[1] - teams[team][player].size[1]/2 - this.position[1],2)) < this.expRadius/2) {
				teams[team][player].life = teams[team][player].life - this.dmg;
				teams[team][player].playerHitCount = -4;
				c = [teams[team][player].position[0] - this.position[0],teams[team][player].position[1] - teams[team][player].size[1]/2 - this.position[1]];
				cL = Math.sqrt(Math.pow(c[0],2) + Math.pow(c[1],2));
				teams[team][player].velocity = [(c[0]*this.bulletPower)/cL, (c[1]*this.bulletPower)/cL];
			}
		}
	}
}


var Weapon = function(sprite, bulletSprite, bulletSpriteSize, bulletSize, spriteSize, size, ammunition, dmg, exRadius, bP) {
	this.ammunition = ammunition;
	this.explosionRadius = exRadius;
	this.dmg = dmg;
	this.bulletPower = bP;
	this.sprite = sprite; //weapon sprite
	this.spriteSize = spriteSize; //weapon sprite size
	this.size = size; //weapon size in game
	this.bulletSprite = bulletSprite;
	this.bulletSpriteSize = bulletSpriteSize;
	this.bulletSize = bulletSize;
	this.bulletPosition = [0, 0];
	this.bulletVelocity = [0, 0];
	this.bulletMoving = false;
	this.weaponPosition = [0, 0];
	this.weaponDir = 0;
	this.bulletDir = 0;
	this.weaponDirection = false;
	this.bulletDirection = false;
	this.hitPosition = [0,0];
	this.weaponPower = 0;
	//points for bullet simulation line
	this.simBulletPoints = [];
	//for collision detection:
	this.tempOldPosition = [0,0];
	this.oldPosition = [0,0];
};

Weapon.prototype.render = function(ctx) {
	console.log('no weapon render yet!');
};

Weapon.prototype.update = function(dt){
};



Weapon.prototype.setWeaponDir = function(weaponPosition, mousePosition) {
	var a = mousePosition[0] + cameraPos[0] - weaponPosition[0];
	var b = mousePosition[1] + cameraPos[1] - weaponPosition[1];
	var c = Math.sqrt(Math.pow(a,2) + Math.pow(b,2));
	this.weaponDir = Math.asin(b/c);
	if(mousePosition[0]+ cameraPos[0] > weaponPosition[0]) {
		this.weaponDirection = false;
	} else {
		this.weaponDirection = true;
	}
};

Weapon.prototype.setWeaponPower = function(wepP, mousePos) {
	c = Math.sqrt(Math.pow(wepP[0] - mousePos[0]-cameraPos[0],2) + Math.pow(wepP[1] - mousePos[1]-cameraPos[1],2));
	l = 100;
	percent = c/(l/100);
	if(percent > 100){
		percent = 100;
	}
	this.weaponPower = 10*percent;
};

Weapon.prototype.fireRound = function() {
	var y = Math.sin(this.weaponDir);
	var x = 1 - Math.pow(y,2);
	oldPosition = this.weaponPosition.slice(0,2);
	if(this.weaponDirection) {
		bulletVelocity = [x*this.weaponPower,-y*this.weaponPower];
	} else {
		bulletVelocity = [-x*this.weaponPower,-y*this.weaponPower];
	}
	sL = Math.sqrt(Math.pow(bulletVelocity[0],2) + Math.pow(bulletVelocity[1],2));
	x0 = bulletVelocity[0] / sL;
	y0 = bulletVelocity[1] / sL;
	bulletPosition = [this.weaponPosition[0] + x0*30, this.weaponPosition[1] + y0*30];
	bulletDir = this.weaponDir;
	bulletMoving = true;
	bullets[bullets.length] = new Projectile(this.bulletSprite, this.bulletSpriteSize, this.bulletSize, this.dmg, this.explosionRadius, bulletPosition, bulletVelocity, this.bulletPower);
	
	nextTurnTimer = 3;
};


Weapon.prototype.simBullet = function() {
	var dt = 0.01;
	this.simBulletPoints = [];
	var simBulletVel = [0,0];
	var y = Math.sin(this.weaponDir);
	var x = 1 - Math.pow(y,2);
	if(this.weaponDirection) {
		simBulletVel = [x*this.weaponPower,-y*this.weaponPower];
	} else {
		simBulletVel = [-x*this.weaponPower,-y*this.weaponPower];
	}
	//make the bullet start at the end og the gun
	sL = Math.sqrt(Math.pow(simBulletVel[0],2) + Math.pow(simBulletVel[1],2));
	x0 = simBulletVel[0] / sL;
	y0 = simBulletVel[1] / sL;
	
	this.simBulletPoints[0] = [this.weaponPosition[0] + x0*30,this.weaponPosition[1] + y0*30];
	var simLength = 0;
	var startLengthReached = -999;
	for(p = 1; p < 50; p++) {
		if(simLength > 10 && startLengthReached == -999) {
			startLengthReached = p;
		}
		if(simLength < 100) {
			this.simBulletPoints[p] = [	this.simBulletPoints[p-1][0] + simBulletVel[0]*dt + 1/2*gravity[0]*Math.pow(dt,2), 
										this.simBulletPoints[p-1][1] + simBulletVel[1]*dt + 1/2*gravity[1]*Math.pow(dt,2)];
			simBulletVel = [simBulletVel[0] + gravity[0]*dt,simBulletVel[1] + gravity[1]*dt];
			simLength = simLength + Math.sqrt(Math.pow(this.simBulletPoints[p][0] - this.simBulletPoints[p - 1][0],2) + Math.pow(this.simBulletPoints[p][1] - this.simBulletPoints[p - 1][1],2));
		} else {
			break;
		}
	}
	if(startLengthReached != -999) {
		this.simBulletPoints.slice(this.startLengthReached);
	}
}

var Bazooka = function(ammunition) {
	Weapon.call(this, images.bazooka, images.bazookaRound, [35,35], [10,10], [60,20], [30,10], ammunition, 30, 100, 300); //add all function arguments.
}

Bazooka.prototype = Object.create(Weapon.prototype);

Bazooka.prototype.constructor = Bazooka;

Bazooka.prototype.render = function(ctx, playerPos, playerSize, showWeapon) {
	//Draw Weapon
	if(showWeapon) {
		if(this.weaponDirection){
			ctx.save();
			ctx.translate(playerPos[0]-cameraPos[0], playerPos[1]-cameraPos[1] - playerSize[1]/2);
			ctx.rotate(-this.weaponDir);
			ctx.drawImage(this.sprite, 0, 0, this.spriteSize[0], this.spriteSize[1], Math.round(-this.size[0]/2), Math.round(-this.size[1]/2), this.size[0], this.size[1]);
			ctx.restore();
		} else {
			ctx.save();
			ctx.scale(-1,1);
			ctx.translate(-(playerPos[0]-cameraPos[0]), playerPos[1]-cameraPos[1] - playerSize[1]/2);
			ctx.rotate(-this.weaponDir);
			ctx.drawImage(this.sprite, 0, 0, this.spriteSize[0], this.spriteSize[1], Math.round(-this.size[0]/2), Math.round(-this.size[1]/2), this.size[0], this.size[1]);
			ctx.restore();
		}
		if(this.simBulletPoints.length != 0){
			
			ctx.beginPath();
			ctx.moveTo(this.simBulletPoints[0][0] - cameraPos[0], this.simBulletPoints[0][1] - cameraPos[1]);
			for(point = 1; point < this.simBulletPoints.length; point++) {
				ctx.lineTo(this.simBulletPoints[point][0] -cameraPos[0],this.simBulletPoints[point][1] - cameraPos[1]);
			}
			ctx.stroke();
		} 
	}

};


var User = function(name, id, level, xp, coins, players, weapons) {
	
}

var Player = function(pos, sprite, spriteSize, size, life, v, team, name ) {
	this.position = pos;
	this.tempOldPosition = pos.slice(0,2);
	this.oldPosition = pos.slice(0,2);
	this.velocity = v;
	this.sprite = sprite;
	this.spriteSize = spriteSize;
	this.size = size;
	this.life = life;
	this.team = team;
	this.bMoving = true;
	this.jumpCount = 0;
	this.direction;
	this.spriteCount = 0; //animation count
	this.playerPressed = false;
	this.weaponDrawn = false;
	this.currentWeapon = 0; //number in weapons
	this.playerHitCount = 2;
	this.weapons = [];
	this.name = name;
	this.shotFired = false;
	this.playerEngaged = false;
	this.playerEngagedCounter = 0;
};

Player.prototype.render = function(ctx, bCurrentPlayer) {
	if(this.life > 0) {
		
		//life bar
		ctx.save();
		
		var grd = ctx.createLinearGradient(Math.round(this.position[0] - cameraPos[0] - (this.name.length*5)/2) - 1, 0, Math.round(this.position[0] - cameraPos[0] - (this.name.length*5)/2) - 1 + this.name.length*5 + 2, 0);
		grd.addColorStop(0.01*this.life, "#00FF00");
		if(this.life < 90) {
			grd.addColorStop(0.01*this.life + 0.1, "red");
		} else if(this.life > 90 && this.life < 100) {
			grd.addColorStop(1, "red");
		}
		ctx.fillStyle = grd;
		ctx.lineWidth = 1;
		roundRect(ctx, Math.round(this.position[0] - cameraPos[0] - (this.name.length*5)/2) - 1, Math.round(this.position[1] - cameraPos[1] - this.size[1]*1.5) - 15, this.name.length*5 + 2, 15, 2, true, true );

		ctx.fillStyle = 'black';
		ctx.font = '10pt Comic Sans MS';
		ctx.fillText(this.name, Math.round(this.position[0] - cameraPos[0] - (this.name.length*5)/2), Math.round(this.position[1] - cameraPos[1] - this.size[1]*1.5 - 3), this.name.length*5);
		if(!this.playerEngaged && bCurrentPlayer) {
			ctx.drawImage(images.arrow, Math.round(this.position[0] - cameraPos[0] - this.size[0]/2), Math.round(this.position[1] - cameraPos[1] - this.size[1]*2.5 - 15) - this.playerEngagedCounter, 15, 15 );
			
			if(this.playerEngagedCounter > 5) {
				this.playerEngagedCounter = 0;
			} else{
				this.playerEngagedCounter = this.playerEngagedCounter + 0.1;
			}
		}
		ctx.restore();
		
		
		if(this.jumpCount == 5 && !this.weaponDrawn) {
			if(this.direction == 'LEFT') {
				ctx.save();
				ctx.scale(-1,1);
			ctx.drawImage(	this.sprite, Math.floor(this.jumpCount*this.spriteSize[0]), this.spriteSize[1]*2, this.spriteSize[0], this.spriteSize[1],
							Math.round(-(this.position[0] - cameraPos[0] + this.size[0] / 2)), Math.round(this.position[1] - cameraPos[1] - this.size[1]),
							this.size[0], this.size[1]);
				ctx.restore();
			} else {
				ctx.drawImage(	this.sprite, Math.floor(this.jumpCount*this.spriteSize[0]), this.spriteSize[1]*2, this.spriteSize[0], this.spriteSize[1],
								this.position[0] - cameraPos[0] - this.size[0] / 2, this.position[1] - cameraPos[1] - this.size[1],
								this.size[0], this.size[1]);
			}
		}else if(this.weaponDrawn) {
			if(this.position[0] < mouseP[0] + cameraPos[0]) {
				ctx.save();
				ctx.scale(-1,1);
				ctx.drawImage(	this.sprite, this.spriteSize[0], 0, this.spriteSize[0], this.spriteSize[1],
							Math.round(-(Math.round(this.position[0]) - cameraPos[0] + this.size[0] / 2)), Math.round(this.position[1] - cameraPos[1] - this.size[1]),
							this.size[0], this.size[1]);
				ctx.restore();
			} else {
				ctx.drawImage(	this.sprite, this.spriteSize[0], 0, this.spriteSize[0], this.spriteSize[1],
							Math.round(this.position[0] - cameraPos[0] - this.size[0] / 2), Math.round(this.position[1] - cameraPos[1] - this.size[1]),
							this.size[0], this.size[1]);
			}
		} else if(pressedKeys['UP'] && this.jumpCount < 5 && !this.weaponDrawn && bCurrentPlayer) {
			if(this.direction == 'LEFT') {
				ctx.save();
				ctx.scale(-1,1);
				ctx.drawImage(	this.sprite, Math.floor(this.jumpCount)*this.spriteSize[0], this.spriteSize[1]*2, this.spriteSize[0], this.spriteSize[1],
								Math.round(-(Math.round(this.position[0]) - cameraPos[0] + this.size[0] / 2)), Math.round(this.position[1] - cameraPos[1] - this.size[1]),
								this.size[0], this.size[1]);
				ctx.restore();
			} else {
				ctx.drawImage(	this.sprite, Math.floor(this.jumpCount)*this.spriteSize[0], this.spriteSize[1]*2, this.spriteSize[0], this.spriteSize[1],
								Math.round(this.position[0] - cameraPos[0] - this.size[0] / 2), Math.round(this.position[1] - cameraPos[1] - this.size[1]),
								this.size[0], this.size[1]);
			}
			this.jumpCount = this.jumpCount + 0.5;
		} else if(pressedKeys['RIGHT'] && !this.bMoving && !this.weaponDrawn && bCurrentPlayer) {
			ctx.drawImage(	this.sprite, Math.floor(this.spriteCount)*this.spriteSize[0], this.spriteSize[1], this.spriteSize[0], this.spriteSize[1],
							Math.round(this.position[0] - cameraPos[0] - this.size[0] / 2), Math.round(this.position[1] - cameraPos[1] - this.size[1]),
							this.size[0], this.size[1]);
			if(this.spriteCount < 7){
				this.spriteCount = this.spriteCount + 0.5;
			} else {
				this.spriteCount = 0;
			}
		}else if(pressedKeys['LEFT'] && !this.bMoving && !this.weaponDrawn && bCurrentPlayer) {
			ctx.save();
			ctx.scale(-1,1);
			ctx.drawImage(	this.sprite, Math.floor(this.spriteCount)*this.spriteSize[0], this.spriteSize[1], this.spriteSize[0], this.spriteSize[1],
							Math.round(-(Math.round(this.position[0]) - cameraPos[0] + this.size[0] / 2)), Math.round(this.position[1] - cameraPos[1] - this.size[1]),
							this.size[0], this.size[1]);
			ctx.restore();
			if(this.spriteCount < 7){
				this.spriteCount = this.spriteCount + 0.5;
			} else {
				this.spriteCount = 0;
			}
		}else if(this.weaponDrawn && !this.bMoving) {
			
		}else if(bCurrentPlayer) {
			if(this.direction == 'LEFT') {
				ctx.save();
				ctx.scale(-1,1);
			ctx.drawImage(	this.sprite, this.spriteSize[0], 0, this.spriteSize[0], this.spriteSize[1],
							Math.round(-(this.position[0] - cameraPos[0] + this.size[0] / 2)), Math.round(this.position[1] - cameraPos[1] - this.size[1]),
							this.size[0], this.size[1]);
				ctx.restore();
			} else {
				ctx.drawImage(	this.sprite, this.spriteSize[0], 0, this.spriteSize[0], this.spriteSize[1],
								this.position[0] - cameraPos[0] - this.size[0] / 2, this.position[1] - cameraPos[1] - this.size[1],
								this.size[0], this.size[1]);
			}
		}else {
			ctx.drawImage(	this.sprite, 0, 0, this.spriteSize[0], this.spriteSize[1],
							Math.round(this.position[0] - cameraPos[0] - this.size[0] / 2), Math.round(this.position[1] - cameraPos[1] - this.size[1]),
							this.size[0], this.size[1]);
			spriteCount = 0;
		}
		this.weapons[this.currentWeapon].render(ctx, this.position, this.size, this.weaponDrawn);
		if(!pressedKeys['UP'] && !this.bMoving) {
			this.jumpCount = 0;
		}
	} else if(bCurrentPlayer && nextTurnTimer == 9999) {
		nextTurnTimer = 3;
	} 
};

Player.prototype.update = function(dt, bCurrentPlayer) {
	if(this.life > 0) {
		if(this.playerHitCount < 2) {
			this.bMoving = true;
			this.playerHitCount++;
		}
		//Falling!
		
		if(this.bMoving) {
			this.setOP();
			this.velocity[1] = this.velocity[1] + gravity[1] * dt;
			this.position[0] = this.position[0] + this.velocity[0] * dt;
			this.position[1] = this.position[1] + this.velocity[1] * dt;
			if(checkPixels(Math.round(this.position[0]), Math.round(this.position[1]-this.size[1]),[1,this.size[1]]) && Math.round(this.position[1]) < currentMap.size[1]-1){
				this.position = this.collision(	this.position, [(this.position[0] + (this.oldPosition[0]-this.position[0])/2), 
																(this.position[1] + (this.oldPosition[1]-this.position[1])/2)], 
												this.oldPosition,this.oldPosition);
				if(checkPixel(Math.round(this.position[0]),Math.round(this.position[1]+1))){
					this.bMoving = false;
					this.jumpCount = 0;
				} else if(checkPixel(Math.round(this.position[0]),Math.round(this.position[1]+2))) {
					this.bMoving = false;
					this.position[1] = this.position[1] - 1;
				}
				if(Math.sqrt(Math.pow(this.velocity[0],2) + Math.pow(this.velocity[1],2)) > 400) {
					this.life = this.life - (Math.sqrt(Math.pow(this.velocity[0],2) + Math.pow(this.velocity[1],2)))/30;
				}
				this.velocity = [0,0];
			}
			
		} 
		else if(!bCurrentPlayer) {
			
		}
		//Moving!
		else if(this.weaponDrawn){
			this.weapons[this.currentWeapon].weaponPosition = [this.position[0],this.position[1]-this.size[1]/2];
		}
		else if(pressedKeys['UP'] && this.jumpCount == 5) {
			this.playerEngaged = true;
			this.bMoving = true;
			
			this.setOP();
			if(this.direction == 'RIGHT') {
				this.velocity = [100, -200];
			} else if(this.direction == 'LEFT') {
				this.velocity = [-100, -200];
			}
		} else if(pressedKeys['LEFT'] || pressedKeys['RIGHT']) {
			this.playerEngaged = true;
			var endOfLoop = this.position[1] + 4;
			pI = pixelInfo(this.position[0]-1, this.position[1]-4,[3, 8]);
			//Moving Left
				if(pressedKeys['LEFT']) {
					for(yp = 0; yp < 22; yp = yp + 3) {
						if(pI[yp] && yp != 21) {
							if(this.position[1] + (yp/3) - 4 > this.position[1] - 4 && this.position[1] + (yp/3) - 4 < this.position[1] + 3) {
								if(this.walkCollision([this.position[0] - 1, this.position[1] + (yp/3) - 4])) {
									this.setOP();
									this.position[0] = this.position[0]-1;
									this.position[1] = this.position[1] + (yp/3) - 4;
								}
								this.direction = 'LEFT';
								break;
							} else if(this.position[1] + (yp/3) - 4 == this.position[1] - 4) {
								this.direction = 'LEFT';
								break;
							}
						} else if(this.position[1] + (yp/3) - 4 >= this.position[1] + 3){
							if(this.walkCollision([this.position[0] - 1, this.position[1]])) {
								this.position[0] = this.position[0] - 1;
								this.velocity[0] = -50;
								this.bMoving = true;
								this.jumpCount = 5;
							}
						}
						this.direction = 'LEFT';
					}
				//Moving Right!
				} if(pressedKeys['RIGHT']) {
					for(yp = 0; yp < 22; yp = yp + 3) {
						if(pI[yp+2] && yp != 21) {
							if(this.position[1] + (yp/3) - 4 > this.position[1] - 4 && this.position[1] + (yp/3) - 4 < this.position[1] + 3) {
								if(this.walkCollision([this.position[0] + 1, this.position[1] + (yp/3) - 4])) {
									this.setOP();
									this.position[0] = this.position[0]+1;
									this.position[1] = this.position[1] + (yp/3) - 4;
								}
								this.direction = 'RIGHT';
								break;
							} else if(this.position[1] + (yp/3) - 4 == this.position[1] - 4) {
								this.direction = 'RIGHT';
								break;
							}
						} else if(this.position[1] + (yp/3) - 4 >= this.position[1] + 3) {
							if(this.walkCollision([this.position[0] + 1, this.position[1]])) {
								this.position[0] = this.position[0] + 1;
								this.velocity[0] = 50;
								this.bMoving = true;
								this.jumpCount = 5;
							}
						}
					this.direction = 'RIGHT';
					}
				}
		} 
	}
	if(!bCurrentPlayer && this.weaponDrawn) {
		this.weaponDrawn = false;
	}
	//players weapon:
	if(this.weaponDrawn && bullets.length == 0) {
		this.weapons[this.currentWeapon].simBullet();
	} else {
		this.weapons[this.currentWeapon].simBulletPoints = [];
	}
	//If the player leaves the screen it dies.
	if(this.position[0] < -40 || this.position[0] > currentMap.size[0] + 40 || this.position[1] > currentMap.size[1] + 40) {
		this.life = 0;
	}
};

Player.prototype.walkCollision = function(pos) {
	for(yn = pos[1]-this.size[1]; yn < pos[1]; yn = yn + this.size[1]/2) {
		if(checkPixel(Math.round(pos[0]),Math.round(yn))) {
			return false;
		}
	}
	return true;
}

//set old position
Player.prototype.setOP = function() {
	if(Math.sqrt(Math.pow((this.tempOldPosition[0]-this.position[0]),2) + Math.pow((this.tempOldPosition[1]-this.position[1]),2)) > 5){
		this.oldPosition = this.tempOldPosition.slice(0,2);
		this.tempOldPosition = this.position.slice(0,2);
	}
}

// box is given by [topLeftCornerX, topLeftCornerY, sizeX, sizeY], velocity v is given by [xv, yv]
Player.prototype.collision = function(pos, cPos, oP, originalOP) {
	if(pos[0]-oP[0] > 1 || pos[1]-oP[1] > 1) {
		if(checkPixels(Math.round(cPos[0]), Math.round(cPos[1]-this.size[1]), [1, this.size[1]])) {
			pos = cPos.slice(0,2);
			cPos[0] = cPos[0] + (oP[0] - cPos[0])/2;
			cPos[1] = cPos[1] + (oP[1] - cPos[1])/2;
			cPos = this.collision(pos, cPos, oP, originalOP);
		} else{
			oP = cPos.slice(0,2);
			cPos[0] = pos[0] + (cPos[0] - pos[0])/2;
			cPos[1] = pos[1] + (cPos[1] - pos[1])/2;
			cPos = this.collision(pos, cPos, oP,originalOP);
		}
	}
	return cPos;
}

Player.prototype.mouseHandler = function() {
	if(this.shotFired) {
		return true;
	} else if(mousePressedC && pressedMouseP[0]+cameraPos[0] > this.position[0] - this.size[0]/2 && pressedMouseP[0]+cameraPos[0] < this.position[0] + this.size[0]/2 && 
						pressedMouseP[1]+cameraPos[1] > this.position[1] - this.size[1] && pressedMouseP[1]+cameraPos[1] < this.position[1]) {
		this.weaponDrawn = true;
		this.playerPressed = true;
		this.playerEngaged = true;
		return false;
	} 
	//stops mouse over player
	else if(this.playerPressed && (mouseP[0]+cameraPos[0] > this.position[0] - this.size[0]/2 && mouseP[0]+cameraPos[0] < this.position[0] + this.size[0]/2 && 
										mouseP[1]+cameraPos[1] > this.position[1] - this.size[1] && mouseP[1]+cameraPos[1] < this.position[1])
								&& !mouseDown) {
		this.playerPressed = false;
		this.weaponDrawn = false;
		return false;
	} 
	//Moves weapon, outside player
	else if(this.playerPressed &&   !(mouseP[0]+cameraPos[0] > this.position[0] - this.size[0]/2 && mouseP[0]+cameraPos[0] < this.position[0] + this.size[0]/2 && 
										mouseP[1]+cameraPos[1] > this.position[1] - this.size[1] && mouseP[1]+cameraPos[1] < this.position[1])
								 && mouseDown) {
		this.weapons[this.currentWeapon].setWeaponDir([this.position[0], this.position[1] - this.size[1]/2], mouseP );
		this.weapons[this.currentWeapon].setWeaponPower([this.position[0], this.position[1] - this.size[1]/2], mouseP );
		return false;
	}
	//stops mouse outside player
	else if (this.playerPressed &&   !(mouseP[0]+cameraPos[0] > this.position[0] - this.size[0]/2 && mouseP[0]+cameraPos[0] < this.position[0] + this.size[0]/2 && 
										mouseP[1]+cameraPos[1] > this.position[1] - this.size[1] && mouseP[1]+cameraPos[1] < this.position[1])
								 && !mouseDown) {
		this.weapons[this.currentWeapon].setWeaponDir([this.position[0], this.position[1] - this.size[1]/2], mouseP );
		this.weapons[this.currentWeapon].setWeaponPower([this.position[0], this.position[1] - this.size[1]/2], mouseP );
		this.weapons[this.currentWeapon].fireRound();
		this.shotFired = true;
		this.playerPressed = false;
		return false;
	}
	//Moves mouse over player
	else if(this.playerPressed &&   (mouseP[0]+cameraPos[0] > this.position[0] - this.size[0]/2 && mouseP[0]+cameraPos[0] < this.position[0] + this.size[0]/2 && 
									   mouseP[1]+cameraPos[1] > this.position[1] - this.size[1] && mouseP[1]+cameraPos[1] < this.position[1])
								 && mouseDown) {
		return false;
	}
	//if it doesn't affect player, lets the mouse do something else
	else {
		return true;
	}
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
	bullet: 		'/Art/bullet.png',
	Man1: 			'/Art/Man1.png',
	spaceMan:		'/Art/SpaceMan/spacemanSS.png',
	spaceManRed:	'/Art/SpaceMan/spacemanSSred.png',
	bazooka:		'/Art/Weapons/bazooka.png',
	bazookaRound:	'/Art/Weapons/bazookaRound.png',
	local1vs1:		'/Art/Menu/local1vs1.png',
	local2vs2:		'/Art/Menu/local2vs2.png',
	local4vs4:		'/Art/Menu/local4vs4.png',
	arrow:			'/Art/arrow.png'
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

