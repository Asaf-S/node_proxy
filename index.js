var http = require('http');
var port = process.argv[0] || 3000;
http.createServer(function (req, res) {
  console.log('req');

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n\n');
}).listen(port, "127.0.0.1");
console.log('Server running at http://127.0.0.1:'+port+'/');