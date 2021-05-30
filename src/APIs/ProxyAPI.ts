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

  const incomingData: IRequestType = incomingReq.body;
  incomingData.queryParams = incomingData.queryParams || {};
  incomingData.headers = incomingData.queryParams || {};

  try {
    let superagentRequest: superagent.SuperAgentRequest;
    switch (incomingReq.method) {
      case METHOD_TYPES.POST:
        superagentRequest = superagent.post(incomingData.url);
        break;

      case METHOD_TYPES.GET:
      default:
        superagentRequest = superagent.get(incomingData.url);
        break;
    }

    superagentRequest = superagentRequest.query(incomingData.queryParams).set(incomingData.headers);

    if (incomingData.body && incomingReq.method !== METHOD_TYPES.GET) {
      superagentRequest = superagentRequest.send(incomingData.body);
    }

    return superagentRequest.then((incomingResponse: superagent.Response) => {
      const output = {
        body: incomingResponse.body || {},
        text: incomingResponse.text || '',
        headers: incomingResponse.headers || {},
        status: incomingResponse.status,
        statusCode: incomingResponse.status,
        method: incomingReq.method as METHOD_TYPES,
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
        method: incomingReq.method as METHOD_TYPES,
        startTimestamp,
        endTimestamp: new Date().toISOString(),
        // req: incomingReq,
      };
      console.error(`${incomingReq.id} - output error (1): ${utils.convertToString(output)}`); // tslint:disable-line // eslint-disable-line no-console
      return outgoingRes.json(output);
    });

  } catch (err2) {
    const output = {
      body: {},
      text: err2.stack,
      headers: {},
      status: 0,
      statusCode: 0,
      method: incomingReq.method as METHOD_TYPES,
      startTimestamp,
      endTimestamp: new Date().toISOString(),
      // req: incomingReq,
    };
    console.error(`${incomingReq.id} - output error (2): ${utils.convertToString(output)}`); // tslint:disable-line // eslint-disable-line no-console
    return outgoingRes.json(output);
  }
}

export default ProxyAPI;
