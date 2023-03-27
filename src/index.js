var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(8000, function(){
  console.log('listening on *:8000');
}); 