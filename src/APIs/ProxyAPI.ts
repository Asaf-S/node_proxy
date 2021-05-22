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
	body: object,
	queryParams: object,
	headers: object,
}
interface IResponseType {
  status: number;
  statusCode: number;
  body: object;
  text: string;
  headers: Record<string, string>;
  method: METHOD_TYPES;
  startTimestamp: string,
  endTimestamp: string,
}

type Send<T = Response> = (body?: IResponseType) => T;

interface CustomResponse extends express.Response {
  json: Send<this>;
}

async function ProxyAPI(incomingReq: ICustomRequest<IRequestType>, outgoingRes: CustomResponse) {

  const startTimestamp = (new Date()).toISOString();

  const incomingData: IRequestType = incomingReq.body;

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
      return outgoingRes.json({
        body: incomingResponse.body || {},
        text: incomingResponse.text || '',
        headers: incomingResponse.headers || {},
        status: incomingResponse.status,
        statusCode: incomingResponse.status,
        method: incomingReq.method as METHOD_TYPES,
        startTimestamp,
        endTimestamp: new Date().toISOString(),
      });

    }).catch((err1: superagent.ResponseError) => {
      return outgoingRes.json({
        body: (err1.response?.body) || {},
        text: err1.response?.text || '',
        headers: (err1.response?.headers) || {},
        status: err1.status || 0,
        statusCode: err1.status || 0,
        method: incomingReq.method as METHOD_TYPES,
        startTimestamp,
        endTimestamp: new Date().toISOString(),
      });
    });

  } catch (err2) {
    return outgoingRes.json({
      body: {},
      text: err2.stack,
      headers: {},
      status: 0,
      statusCode: 0,
      method: incomingReq.method as METHOD_TYPES,
      startTimestamp,
      endTimestamp: new Date().toISOString(),
    });
  }
}

export default ProxyAPI;
