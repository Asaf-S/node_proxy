var http = require('http');
const superagent = require('superagent');
var port = process.argv[2] || 80;
// var ip = '35.180.14.57' || "127.0.0.1"
console.log('Starting... (port:'+port+')');

http.createServer(function (req, res) {
  console.log('Received event:', JSON.stringify(Object.keys(req), null, 2));

  var i=0;
  switch(req.method) {
    case 'POST':
      let data = []
      req.on('data', chunk => {
        console.log('chunk of body: '+ (++i));
        data.push(chunk);
      })
      req.on('end', () => {
        data=JSON.parse(data) // 'Buy the milk'
        if(!data) {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({
            data:data,
          }));
        } else if(data.url && data.body && data.queryParams && data.headers) {

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
        } else {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({
            url:data.url,
            body:data.body,
            queryParams:data.queryParams,
            headers:data.headers,
          }));
        }
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