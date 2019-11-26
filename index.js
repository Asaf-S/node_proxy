var http = require('http');
const superagent = require('superagent');
var port = process.argv[2] || 80;
// var ip = '35.180.14.57' || "127.0.0.1"
console.log('Starting... (port:'+port+')');

http.createServer(function (req, res) {
  console.log('Received event:', JSON.stringify(Object.keys(req), null, 2));

  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({}));
}).listen(port, ()=>{
  console.log('Server running at port: '+port);
});


// exports.handler = (event, context, callback) => {
    

//     switch (event.httpMethod) {
//         // case 'DELETE':
//         //     dynamo.deleteItem(JSON.parse(event.body), done);
//         //     break;
//         case 'GET':
//             // dynamo.scan({ TableName: event.queryStringParameters.TableName }, done);
//             break;
//         case 'POST':
//           let data = JSON.parse(event.body);

//           superagent
//             .post(data.url)
//             .send(data.body)
//             .query(data.queryParams)
//             .set(data.headers)
//             .end((err, res) => {
//               try {
//                 let proxyResp = {
//                   err:err,
//                   res:res,
//                 };
//                 return res.json(proxyResp);
//               } catch(e) {
//                 console.log('Try-Catch ERROR: '+e);
//                 return res.json({err:e});
//               }
//             });
//             break;
//         // case 'PUT':
//         //     dynamo.updateItem(JSON.parse(event.body), done);
//         //     break;
//         default:
//             // done(new Error(`Unsupported method "${event.httpMethod}"`));
//     }
// };
