import { Response, SuperAgentRequest } from 'superagent';
interface MySuperAgentRequest extends SuperAgentRequest {
  path: string,
}
interface MySuperAgentResponse extends Response {
  req: MySuperAgentRequest,
}