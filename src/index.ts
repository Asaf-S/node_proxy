import app from './app';
import utils from './utils';

const PORT = process.argv[2] || process.env.PORT || 80;

process.on('unhandledRejection', (reason, promise) => {
  utils.consoleError(`---------
    Warning: Unhandled Promise Rejection!
    Usually this happens when:
    (1) Promise rejects, and there's no catch.
    (2) Promise inside a promise: The parent promise has 'catch', but the child doesn't use 'return' (which bubbles up the Error/rejection to the parent).
    Also, you can catch it at the child, and re-throw a parsed error for example.
    This problem is easy to spot, because the parent Promise never resolves/rejects/finishes.
    (3) Functions with callback functions might also be dangerous if not properly returned.

    Promise: ${promise}
    Reason: ${utils.convertToString(reason)}
    ---------`);
});

process.on('uncaughtException', err => {
  utils.consoleError(`---------\nUncaught Exception at: ${err.stack}\n---------`);
});

utils.consoleLog(`${new Date().toISOString()} - WEB SERVER - STARTED!`);

if (process.env.NODE_ENV !== 'development') {
  const _tmpEnvObj: { [key: string]: string | undefined } = {};
  Object.keys(process.env).forEach(key => {
    if (/DATABASE_URL/i.test(key)) {
      _tmpEnvObj[key] = (process.env[key] || '').replace(/(.*?:[^\/]{2}.)([^@]*)(...@.*)/, '$1***$3');
    } else if (/KEY|PASS|SECRET|TOKEN/i.test(key)) {
      _tmpEnvObj[key] = /keyword/i.test(key)
        ? process.env[key]
        : (process.env[key] || '').replace(/(.{3})(.*)(.{3})/, '$1***$3');
    } else {
      _tmpEnvObj[key] = process.env[key];
    }
  });
  utils.consoleLog(`process.env = ${JSON.stringify(_tmpEnvObj, null, 2)}\n`);
}

app.listen(PORT, () => utils.consoleLog(`${new Date().toISOString()} - Express - Listening on ${PORT}\n`));
