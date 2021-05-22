import { Request, Response, NextFunction } from 'express';
// import * as firebase from 'firebase-admin';

export interface ICustomNextFunction extends NextFunction { }
export interface ICustomRequest extends Request {
  // user?: firebase.auth.DecodedIdToken,
  isBodyTooLong?: boolean,
  id?: string,
}
export interface ICustomResponse extends Response {
  whitelisted?: boolean,
}
