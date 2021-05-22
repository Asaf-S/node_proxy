import request from 'supertest';
import app from '../app';

test('Hello World', async () => {
  const res = await request(app).get('/helloworld');
  const response = {
    hello: 'world',
  };
  // console.log(`res=${JSON.stringify(res, null, 2)}`);
  expect(res.status).toBe(200);
  expect(res.body).toEqual(response);
});
