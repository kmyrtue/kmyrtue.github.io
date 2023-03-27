
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