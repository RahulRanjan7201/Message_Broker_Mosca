const mosca = require('mosca');
const settings = {
		port:1883
		}

const server = new mosca.Server(settings);

server.on('ready', function(){
console.log("Broker is ready and up");
});