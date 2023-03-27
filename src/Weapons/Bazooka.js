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
