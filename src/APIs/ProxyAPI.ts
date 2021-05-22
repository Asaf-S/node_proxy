import { ICustomRequest, ICustomResponse } from '../types/expressCustom';

async function ProxyAPI(req: ICustomRequest, res: ICustomResponse) {
  return res.json({
    hello: 'world',
  });
}

export default ProxyAPI;
