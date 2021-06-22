import express, { Request } from 'express';
import type * as E from 'express';
import { ICustomRequest, ICustomResponse } from '../types/expressCustom';
import utils from '../utils';
import superagent, { post } from 'superagent';

enum METHOD_TYPES {
  GET = "GET",
  POST = "POST",
}

interface IRequestType {
  url: string,
	body: object | string,
	queryParams: object,
  headers: object,
  method?: METHOD_TYPES,
}

interface IResponseType {
  status: number;
  statusCode: number;
  body: object | string;
  text: string;
  headers: Record<string, string>;
  method: METHOD_TYPES;
  startTimestamp: string,
  endTimestamp: string,
  // req?: express.Request,
}

type Send<T = Response> = (body?: IResponseType) => T;

interface CustomResponse extends express.Response {
  json: Send<this>;
}

async function ProxyAPI(incomingReq: ICustomRequest<IRequestType>, outgoingRes: CustomResponse) {

  const startTimestamp = (new Date()).toISOString();

  try {
    // Prepare data
    let parsedIncomingData: IRequestType = incomingReq.body;
    if (typeof (parsedIncomingData) === 'string') {
      utils.consoleLog(`Trying to convert 'parsedIncomingData' from string to JSON: ${utils.convertToString(parsedIncomingData)}`);
      parsedIncomingData = JSON.parse(parsedIncomingData as string);
    }
    parsedIncomingData.queryParams = parsedIncomingData.queryParams || {};
    parsedIncomingData.headers = parsedIncomingData.headers || {};
    parsedIncomingData.method = incomingReq.body.method as METHOD_TYPES || incomingReq.method;
    if (typeof (parsedIncomingData.url) !== 'string' || !parsedIncomingData.url.match(/^http/i)) {
      return outgoingRes.json({
        status: 0,
        statusCode: 0,
        body: {},
        text: `The following expression is false (parsedIncomingData.url=${parsedIncomingData.url}): typeof (parsedIncomingData.url) !== 'string' || !parsedIncomingData.url.match(/^http/i)`,
        headers: {},
        method: parsedIncomingData.method as METHOD_TYPES,
        startTimestamp,
        endTimestamp: new Date().toISOString(),
      });
    }

    let superagentRequest: superagent.SuperAgentRequest = superagent(parsedIncomingData.method, parsedIncomingData.url)
      .query(parsedIncomingData.queryParams)
      .set(parsedIncomingData.headers);

    if (parsedIncomingData.body) {
      superagentRequest = superagentRequest.send(parsedIncomingData.body);
    }

    return superagentRequest.then((incomingResponse: superagent.Response) => {
      const output = {
        body: incomingResponse.body || {},
        text: incomingResponse.text || '',
        headers: incomingResponse.headers || {},
        status: incomingResponse.status,
        statusCode: incomingResponse.status,
        method: parsedIncomingData.method as METHOD_TYPES,
        startTimestamp,
        endTimestamp: new Date().toISOString(),
        // req: incomingReq,
      };
      console.log(`${incomingReq.id} - output: ${utils.convertToString(output)}`); // tslint:disable-line // eslint-disable-line no-console
      return outgoingRes.json(output);

    }).catch((err1: superagent.ResponseError) => {
      const output = {
        body: (err1.response?.body) || {},
        text: err1.response?.text || '',
        headers: (err1.response?.headers) || {},
        status: err1.status || 0,
        statusCode: err1.status || 0,
        method: parsedIncomingData.method as METHOD_TYPES,
        startTimestamp,
        endTimestamp: new Date().toISOString(),
        // req: incomingReq,
      };
      console.error(`${incomingReq.id} - output error (1): ${utils.convertToString(output)}`); // tslint:disable-line // eslint-disable-line no-console
      return outgoingRes.json(output);
    });

  } catch (err2) {
    let _method = '';
    try {
      _method = incomingReq.body.method as METHOD_TYPES;
    } catch (err0) {
      // Do nothing...
    }
    const _parsedMethod: METHOD_TYPES = (_method ? _method : incomingReq.method) as METHOD_TYPES;
    const output = {
      body: {},
      text: err2.stack,
      headers: {},
      status: 0,
      statusCode: 0,
      method: _parsedMethod,
      startTimestamp,
      endTimestamp: new Date().toISOString(),
      // req: incomingReq,
    };
    console.error(`${incomingReq.id} - output error (2): ${utils.convertToString(output)}`); // tslint:disable-line // eslint-disable-line no-console
    return outgoingRes.json(output);
  }
}

export default ProxyAPI;
