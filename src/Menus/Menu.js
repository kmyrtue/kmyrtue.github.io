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