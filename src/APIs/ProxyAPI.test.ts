import request from 'supertest';
import app from '../app';

test('ProxyAPI_happy_flow', async () => {
  const body = {
    url: 'https://httpbin.org/post',
    body: {a: 1, b: 'Textual content'},
    queryParams: {},
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  };
  const res = await request(app).post('/').send(body);

  // console.log(`res=${JSON.stringify(res, null, 2)}`);
  expect(res.status).toBe(200);
  const keysOfResBody = Object.keys(res.body);
  expect(keysOfResBody).toContain('body');
  expect(keysOfResBody).toContain('headers');
  expect(res.body.status).toEqual(200);
  expect(res.body.statusCode).toEqual(200);
  expect(res.body.startTimestamp.substr(0,8)).toEqual(new Date().toISOString().substr(0,8));
  expect(res.body.endTimestamp.substr(0,8)).toEqual(new Date().toISOString().substr(0,8));
  expect(res.body.method).toEqual("POST");
});
