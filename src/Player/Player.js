Player = function(pos, sprite, spriteSize, size, life, v, team, name ) {
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