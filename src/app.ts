import express from 'express';
import cors from 'cors';
import path from 'path';
import addRequestId from 'express-request-id';

// import * as Firebase from './handlers/Firebase';
import { ICustomRequest } from './types/expressCustom';
import ProxyAPI from './APIs/ProxyAPI';
import utils from './utils';

const robot = `User-agent: Googlebot
  User-agent: AdsBot-Google
  User-agent: Googlebot-Image
  User-agent: Mediapartners-Google
  User-agent: *
  Disallow: /`;

export default express()
  // Middlewares
  .use(cors())
  .use(express.static(path.join(__dirname, 'public')))
  .use(addRequestId())
  .use(express.json())
  .use(
    express.urlencoded({
      extended: true,
    })
  )
  .use(
    express.text({
      type: '*/*',
      verify: (req: ICustomRequest, res, buf, enc) => {
        req.isBodyTooLong = buf.byteLength > 1000;
      },
    })
  )
  .use((req, res, next) => {
    utils.consoleLog(new Date().toISOString() + ' - New request: ' + utils.convertRequestToString(req));
    return next();
  })
  .get('/ka', (req, res) => {
    utils.consoleLog('KEEP ALIVE PAGE WAS REACHED!');
    res.set({
      'Cache-Control': 'no-store, no-cache, pre-check=0, post-check=0',
      Pragma: 'no-cache',
    });
    res.json({ alive: 1 });
  })

  // API routes
  .all('/', ProxyAPI)

  // Static resources
  .get('/favicon.ico', (req, res) => res.send(''))
  .get('/robots.txt', (req, res) => res.send(robot))

  // Wildcard
  .all('*', (req, res) => {
    const msg = 'Express - Wildcard was caught: ' + utils.convertRequestToString(req);
    utils.consoleError(msg);
    res.sendStatus(404);
  });
