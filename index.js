var http = require('http');
var port = process.argv[2] || 3000;
var ip = '35.180.14.57' || "127.0.0.1"
console.log('port:'+port);

http.createServer(function (req, res) {
  console.log('req');

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n\n');
}).listen(port, ip);
console.log('Server running at http://'+ip+':'+port+'/');