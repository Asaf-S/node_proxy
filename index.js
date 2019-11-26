var http = require('http');
const superagent = require('superagent');
var port = process.argv[2] || 80;
// var ip = '35.180.14.57' || "127.0.0.1"
console.log('Starting... (port:'+port+')');

http.createServer(function (req, res) {
  console.log('Received event:', JSON.stringify(Object.keys(req), null, 2));

  switch(req.method) {
    case 'post':
      let data = []
      req.on('data', chunk => {
        data.push(chunk)
      })
      req.on('end', () => {
        data=JSON.parse(data).todo // 'Buy the milk'
      })
      superagent
        .post(data.url)
        .send(data.body)
        .query(data.queryParams)
        .set(data.headers)
        .end((err1, res1) => {
          var proxyResp={};
          try {
            proxyResp = {
              err:err1,
              res:res1,
            };
          } catch(e) {
            console.log('Try-Catch ERROR: '+e);
          }
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(proxyResp));
        });
      break;
    default:
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        err: req.method
      }));
  }

}).listen(port, ()=>{
  console.log('Server running at port: '+port);
});