var http = require('http');
const superagent = require('superagent');
var port = process.argv[2] || 80;
// var ip = '35.180.14.57' || "127.0.0.1"
console.log('Starting... (port:'+port+')');

http.createServer(function (req, res) {
  console.log('Received event:', JSON.stringify(Object.keys(req), null, 2));

  var respond= (fn,res,jsonResp)=>{
    console.log(fn+' - Responding: '+JSON.stringify(jsonResp,null,2));
    jsonResp.fn=fn;
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(jsonResp));
  };

  var i=0;
  switch(req.method) {
    case 'POST':
      let data = []
      req.on('data', chunk => {
        console.log('chunk of body: '+ (++i));
        data.push(chunk);
      })
      req.on('end', () => {
        console.log('end - body: '+data);

        try {
          data=JSON.parse(data) // 'Buy the milk'
          if(!data) {
            respond('ndata',res,{
              data:data,
            });
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
                respond('sup',res,proxyResp);
              });
          } else {
            respond('ncont',res,{
              url:data.url,
              body:data.body,
              queryParams:data.queryParams,
              headers:data.headers,
            });
          }
        } catch(e) {
          respond('tc-data',res,{
            e:e
          });
        }
      });
      break;
    default:
      respond('def',res,{
        err: req.method
      });
  }

}).listen(port, ()=>{
  console.log('Server running at port: '+port);
});