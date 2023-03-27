
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
