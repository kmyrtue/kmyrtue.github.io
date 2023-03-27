
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