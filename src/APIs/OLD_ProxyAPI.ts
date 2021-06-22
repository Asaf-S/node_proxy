import express, { Request } from 'express';
import type * as E from 'express';
import { ICustomRequest, ICustomResponse } from '../types/expressCustom';
import utils from '../utils';
import superagent, { post, ResponseError } from 'superagent';

enum METHOD_TYPES {
  GET = "GET",
  POST = "POST",
}

interface IRequestType {
  url: string,
	body: object,
	queryParams: object,
	headers: object,
}
interface IResponseType {
  fn?: string,
  startTimestamp?: string,
  endTimestamp?: string,
  data?: string,
  err?: string,
  res?: object,
  url?: string,
  body?: string | object,
  queryParams?: string | object,
  headers?: string | object,
}

type Send<T = Response> = (body?: IResponseType) => T;

interface CustomResponse extends express.Response {
  json: Send<this>;
}

async function OLD_ProxyAPI(incomingReq: ICustomRequest<IRequestType>, outgoingRes: CustomResponse) {

  const startTimestamp = (new Date()).toISOString();
  const randStr = ()=>(Date.now() + Math.random()).toString();
  const redId = new Date().toISOString() + ' - ' + randStr();
  console.log(redId + ' - Received event:', JSON.stringify(Object.keys(incomingReq), null, 2)); // tslint:disable-line // eslint-disable-line no-console


  const respond = (fn: string, _outgoingRes: CustomResponse, jsonResp: IResponseType) => {
    console.log(`${redId} - ${fn} - Responding: ${JSON.stringify(jsonResp, null, 2)}`); // tslint:disable-line // eslint-disable-line no-console
    jsonResp.fn=fn;
    jsonResp.startTimestamp=startTimestamp;
    jsonResp.endTimestamp=(new Date()).toISOString();
    return _outgoingRes.json(jsonResp);
  };

  switch(incomingReq.method) {
    case 'POST':
      const data = incomingReq.body;
      console.log(`${redId} - Body fully received! body: ${data}`); // tslint:disable-line // eslint-disable-line no-console

      try {
        if(!data) {
          return respond('ndata', outgoingRes, { data: undefined });
        } else if(data.url && data.queryParams && data.headers) {

          const superagentRequest = superagent
            .post(data.url)
            .query(data.queryParams)
            .set(data.headers);

          if(data.body) {
            superagentRequest.send(data.body);
          }

          return superagentRequest
            .end((err1: any, incomingResponse) => {
              try {
                const finalOutput: IResponseType = {
                  err: (typeof err1 == 'object' ? err1.stack : '' + err1),
                  res: incomingResponse,
                };
                return respond('sup',outgoingRes,finalOutput);
              } catch(e) {
                console.log(redId+' - Try-Catch ERROR: '+e); // tslint:disable-line // eslint-disable-line no-console
                return respond('sup-err',outgoingRes,{});
              }
            });
        } else {
          return respond('ncont', outgoingRes, {
            url: data.url,
            body: data.body,
            queryParams: data.queryParams,
            headers: data.headers,
          });
        }
      } catch(e) {
        return respond('tc-data',outgoingRes,{
          err: e,
        });
      }
      break;

    default:
      return respond('def', outgoingRes, {
        err: incomingReq.method
      });
  }

  // const startTimestamp = (new Date()).toISOString();

  // const incomingData: IRequestType = incomingReq.body;

  // try {
  //   let superagentRequest: superagent.SuperAgentRequest;
  //   switch (incomingReq.method) {
  //     case METHOD_TYPES.POST:
  //       superagentRequest = superagent.post(incomingData.url);
  //       break;

  //     case METHOD_TYPES.GET:
  //     default:
  //       superagentRequest = superagent.get(incomingData.url);
  //       break;
  //   }

  //   superagentRequest = superagentRequest.query(incomingData.queryParams).set(incomingData.headers);

  //   if (incomingData.body && incomingReq.method !== METHOD_TYPES.GET) {
  //     superagentRequest = superagentRequest.send(incomingData.body);
  //   }

  //   return superagentRequest.then((incomingResponse: superagent.Response) => {
  //     const output = {
  //       body: incomingResponse.body || {},
  //       text: incomingResponse.text || '',
  //       headers: incomingResponse.headers || {},
  //       status: incomingResponse.status,
  //       statusCode: incomingResponse.status,
  //       method: incomingReq.method as METHOD_TYPES,
  //       startTimestamp,
  //       endTimestamp: new Date().toISOString(),
  //       // req: incomingReq,
  //     };
  //     console.log(`${incomingReq.id} - output: ${utils.convertToString(output)}`); // tslint:disable-line // eslint-disable-line no-console
  //     return outgoingRes.json(output);

  //   }).catch((err1: superagent.ResponseError) => {
  //     const output = {
  //       body: (err1.response?.body) || {},
  //       text: err1.response?.text || '',
  //       headers: (err1.response?.headers) || {},
  //       status: err1.status || 0,
  //       statusCode: err1.status || 0,
  //       method: incomingReq.method as METHOD_TYPES,
  //       startTimestamp,
  //       endTimestamp: new Date().toISOString(),
  //       // req: incomingReq,
  //     };
  //     console.error(`${incomingReq.id} - output error (1): ${utils.convertToString(output)}`); // tslint:disable-line // eslint-disable-line no-console
  //     return outgoingRes.json(output);
  //   });

  // } catch (err2) {
  //   const output = {
  //     body: {},
  //     text: err2.stack,
  //     headers: {},
  //     status: 0,
  //     statusCode: 0,
  //     method: incomingReq.method as METHOD_TYPES,
  //     startTimestamp,
  //     endTimestamp: new Date().toISOString(),
  //     // req: incomingReq,
  //   };
  //   console.error(`${incomingReq.id} - output error (2): ${utils.convertToString(output)}`); // tslint:disable-line // eslint-disable-line no-console
  //   return outgoingRes.json(output);
  // }
}

export default OLD_ProxyAPI;
