import { Request, Response, NextFunction } from 'express';
// import * as firebase from 'firebase-admin';

export interface ICustomNextFunction extends NextFunction { }
export interface ICustomRequest<T = any> extends Request {
  // user?: firebase.auth.DecodedIdToken,
  body: T,
  isBodyTooLong?: boolean,
  id?: string,
}
export interface ICustomResponse extends Response {
  whitelisted?: boolean,
}
