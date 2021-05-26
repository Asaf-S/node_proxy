import url from 'url';
import * as superagent from 'superagent';
import path from 'path';
import json_stringify_safe from 'json-stringify-safe';
import util from 'util';
import child_process from 'child_process';

// import sendViaSlack from './handlers/sendViaSlack';
import { ICustomRequest } from './types/expressCustom';

const DAY_IN_MILISECOND = 1000 * 60 * 60 * 24; // 24 hours in milliseconds

function consoleError(errStr: string): void {
  const oneLineMessage = 'cERROR: ' + errStr.trim().split('\n').join('\\n ');
  /* tslint:disable */
  console.error(oneLineMessage);
  /* tslint:enable */

  // let channel = '';
  // switch (process.env.NODE_ENV) {
  //   case 'production':
  //     channel = 'server_errors';
  //     break;
  //   case 'staging':
  //     channel = 'staging_server_errors';
  //     break;
  // }
  // if (channel) {
  //   let functionName = 'Nameless func';
  //   try {
  //     /* tslint:disable */
  //     functionName = arguments.callee.caller.name || 'Nameless func';
  //     /* tslint:enable */
  //   } catch (e) {
  //     functionName = 'Nameless func';
  //   }
  //   sendViaSlack(errStr, functionName, channel);
  // }
}

function consoleLog(logStr: string): void {
  // This is required because of AWS CloudLog (see: https://forums.aws.amazon.com/thread.jspa?threadID=158643).

  /* tslint:disable */
  console.log(logStr.trim().split('\n').join('\\n '));
  /* tslint:enable */

  // var params = {
  //   Entries: [ /* required */
  //     {
  //       Detail: 'STRING_VALUE',
  //       DetailType: 'STRING_VALUE',
  //       EventBusName: 'STRING_VALUE',
  //       Resources: [
  //         'STRING_VALUE',
  //         /* more items */
  //       ],
  //       Source: 'STRING_VALUE',
  //       Time: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789
  //     },
  //     /* more items */
  //   ]
  // };
  // eventbridge.putEvents(params, function(err, data) {
  //   if (err) console.log(err, err.stack); // an error occurred
  //   else     console.log(data);           // successful response
  // });
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EventBridge.html#putEvents-property
  // https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_PutEvents.html
}

function consoleDebug(logStr: string): void {
  // if (process.env.NODE_ENV != 'production') {
  /* tslint:disable */
  console.log(logStr.trim());
  /* tslint:enable */
  // }
}

function getFullUrlFromReqObj(req: ICustomRequest) {
  return decodeURIComponent(
    url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: req.originalUrl,
    })
  );
}

function convertRequestToString(req: ICustomRequest) {
  const logged_req = {
    URL: getFullUrlFromReqObj(req),
    // lang: req.headers["accept-language"], // TODO: parse browser's language - https://stackoverflow.com/questions/11845471/how-can-i-get-the-browser-language-in-node-js-express-js
    // useragent: req.headers['user-agent'], // Headers are already included
    // referrerdomain: req.headers.referrer || req.headers.referer || '', // Headers are already included
    ip: exctractUserIpFromReq(req),
    method: req.method + '/HTTP-VER' + req.httpVersion,
    body: '',
    headers: req.headers,
    query: req.query,
    id: '',
  };

  if (req.id) {
    logged_req.id = req.id;
  }

  // Body
  if (
    !req.method.toLowerCase().includes('get') &&
    (req.headers['transfer-encoding'] ||
      (req.headers['content-length'] && 0 < parseFloat(req.headers['content-length'])))
  ) {
    logged_req.body = req.isBodyTooLong
      ? req.body.substring(0, 10) + ' ................... ' + req.body.substring(req.body.length - 10, req.body.length)
      : req.body;
  }

  return JSON.stringify(logged_req, null, 2);
}

function addGetterToClass(fieldName: string, theClass: any) {
  let isNewGetter = false;
  if (!theClass.getterList) {
    isNewGetter = true;
    theClass.getterList = [];
  } else if (!theClass.getterList.includes(fieldName)) {
    isNewGetter = true;
  }

  if (isNewGetter) {
    theClass.getterList.push(fieldName);
    Object.defineProperty(theClass, fieldName, {
      get() {
        if (this['_' + fieldName]) {
          return this['_' + fieldName];
        } else {
          throw new Error(
            "ERROR! field '" +
              fieldName +
              "' was used before its value was loaded. It happened in the following class:\n" +
              JSON.stringify(theClass, null, 2)
          );
        }
      },
    });
  }
}

async function runCLI(command: string) {
  const fn = `runCLI (${command})`;
  let exitCode: number;

  consoleLog(`${fn} - Executing the following CLI: ${command}`);
  return new Promise((resolve, reject) => {
    child_process
      .exec(command, (err, stdout, stderr) => {
        const outputStr = `Exit code: ${exitCode}${stdout ? `\nStdout is:\n${stdout}` : ''}`;
        if (exitCode) {
          consoleError(`${fn} - ${outputStr}\nError is: ${err}\nStderr is:\n${stderr}`);
          return reject(exitCode);
        } else {
          consoleLog(`${fn} - ${outputStr}`);
          return resolve(exitCode);
        }
      })
      .on('exit', code => {
        exitCode = code || 0;
      });
  });
}

// function flatObject(theObject:object,prefix=''):object {

//   var resultObj:object|object[] = {};
//   if(theObject && typeof(theObject)=='object') {
//     if(Array.isArray(theObject)) {
//       resultObj=[];
//       theObject.map((item)=>{
//         resultObj.push(flatObject(item));
//       });

//     } else {
//       Object.keys(theObject).map((key)=>{
//         if(key!='_id') {
//           if((typeof(theObject[key])=='object') && (Object.prototype.toString.call(theObject[key])=='[object Object]')){
//             resultObj= {
//               ...resultObj,
//               ...flatObject(theObject[key],prefix+key+'.')
//             };
//           } else {
//             resultObj[prefix+key]=theObject[key];
//           }
//         }
//       });
//     }
//   } else if(!prefix) {
//     consoleError('flatObject - problem with theObject, its value is: '+theObject);
//   }
//   return resultObj;
// }

function objectToQueryParamsString(qp: { [key: string]: any }) {
  let parsedQP = '';
  Object.keys(qp).map(k => {
    parsedQP += (parsedQP ? '&' : '?') + k + '=' + convertToString(qp[k]);
  });
  return parsedQP;
}

function exctractUserIpFromReq(req: ICustomRequest): string {
  return ((req.headers['x-forwarded-for'] || '') as string).split(',').pop() || req.socket.remoteAddress || ''; // https://stackoverflow.com/questions/8107856/how-to-determine-a-users-ip-address-in-node (req.connection was replaced by req.socket)
}

function mergeAndRemoveDuplicates(array1: any[], array2: any[]): any[] {
  if (!array1 && !array2) {
    return [];
  } else if (!array1) {
    return [...array2];
  } else if (!array2) {
    return [...array1];
  } else {
    return [...new Set([...array1, ...array2])];
  }
}

function convertArrayIntoObject(array: { [key: string]: object }[], idFieldName: string): object {
  const result: { [key: string]: object } = {};
  let counter: number = 0;
  let key: string;
  if (array && Array.isArray(array) && array.length) {
    array.forEach((item: { [key: string]: object }) => {
      key = item[idFieldName] ? item[idFieldName].toString() : counter.toString();
      counter++;
      result[key] = item;
    });
  }
  return result;
}

function isNumeric(n: any) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function round(num: number, digitsAfterDecimalDot: number) {
  if (isNumeric(num) && isNumeric(digitsAfterDecimalDot)) {
    const _decAmount = digitsAfterDecimalDot >= 0 ? digitsAfterDecimalDot : 2;
    const _mulitplier = Math.pow(10, _decAmount);
    return Math.round(num * _mulitplier) / _mulitplier;
  } else {
    return num;
  }
}

function roundAndFormat(num: number, digitsAfterDecimalDot: number): string {
  if (isNumeric(num) && isNumeric(digitsAfterDecimalDot)) {
    const roundedNumber = round(num, digitsAfterDecimalDot);
    let result = '';
    if (roundedNumber.toString().includes('.')) {
      const numbersAfterDot = roundedNumber.toFixed(digitsAfterDecimalDot).split('.')[1];
      const numbersBeforeDot = roundedNumber.toLocaleString().split('.')[0];
      result = numbersBeforeDot + '.' + numbersAfterDot;
    } else {
      result = roundedNumber.toLocaleString();
    }
    return result;
  } else {
    return num.toString();
  }
}

function getFunctionUniqeName(file: string, theArguments?: IArguments) {
  let calleeName = '';
  try {
    if (theArguments) {
      calleeName = '-' + theArguments.callee.name;
    }
  } catch (e) {
    // Do nothing.
  }
  return path.basename(file) + calleeName;
}

function genRand(min: number, max: number, decimalPlaces: number) {
  const rand = Math.random() * (max - min) + min;
  const power = Math.pow(10, decimalPlaces);
  return Math.floor(rand * power) / power;
}

function genRandId_lettersAndNumbers(length: number) {
  const allCharOptions = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += allCharOptions[genRand(0, allCharOptions.length, 0)];
  }
  return result;
}

function cartesianProduct(array: any[]) {
  const results: any[] = [[]];
  for (const item of array) {
    const copy = [...results];
    for (const itemFromCopy of copy) {
      results.push(itemFromCopy.concat(item));
    }
  }
  return results.filter(item => {
    return item.length;
  });
}

function tryParseJSON(jsonString: string) {
  try {
    const o = JSON.parse(jsonString);

    // Handle non-exception-throwing cases:
    // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
    // but... JSON.parse(null) returns null, and typeof null === "object",
    // so we must check for that, too. Thankfully, null is falsey, so this suffices:
    if (o && typeof o === 'object') {
      return o;
    }
  } catch (e) {
    // Do nothing.
  }

  return false;
}

function convertToString(value: any): string {
  const isError = (obj: any) => {
    return Object.prototype.toString.call(obj) === '[object Error]';
    // return obj && obj.stack && obj.message && typeof obj.stack === 'string'
    //        && typeof obj.message === 'string';
  };

  try {
    switch (typeof value) {
      case 'string':
      case 'boolean':
      case 'number':
      case 'undefined':
      default:
        return '' + value;
      case 'object':
        if (isError(value)) {
          return value.stack;
        } else {
          return json_stringify_safe(value, null, 2);
        }
    }
  } catch (e) {
    return '' + value;
  }
}

function whatIsIt(object: any) {
  if (object === null) {
    return 'null';
  }
  if (object === undefined) {
    return 'undefined';
  }
  if (object.constructor === 'test'.constructor) {
    return 'string';
  }
  if (object.constructor === [].constructor) {
    return 'array';
  }
  if (object.constructor === {}.constructor) {
    return 'object';
  }
  consoleError('Utils.whatIsIt - Unknown type "' + typeof object + '"!');
  return 'unknown';
}

function ip_to_num(matchText: number) {
  return (
    ((matchText >> 24) & 0xff) +
    '.' +
    ((matchText >> 16) & 0xff) +
    '.' +
    ((matchText >> 8) & 0xff) +
    '.' +
    (matchText & 0xff)
  );
}

function getMyExternalIP(cb: (response: object) => void) {
  setTimeout(() => {
    superagent.get('http://ip-api.com/json').end((err1, res1) => {
      try {
        if (err1) consoleError('getMyExternalIP: ' + err1);
        cb(JSON.parse(res1.text));
      } catch (e) {
        consoleError('getMyExternalIP: ' + convertToString(e));
      }
    });
  });
}

function dupicateJson(srcJson: object) {
  return JSON.parse(JSON.stringify(srcJson));
}

function isReallyTrue(value: any): boolean {
  return value && value != '0';
}

function includesOneOfTheseValues(this: any, param1: any[], param2: any[]) {
  let array1: any[];
  let array2: any[];

  if (param2) {
    array1 = param1;
    array2 = param2;
  } else {
    array1 = this;
    array2 = param1;
  }
  // console.log('array1='+JSON.stringify(array1,null,2));
  // console.log('array2='+JSON.stringify(array2,null,2));

  return array1.some(item => array2.includes(item));
}

function PromiseAll_throttled(listOfCallableActions: (() => Promise<any>)[], limit: number) {
  // See 'throttleActions' function in:
  // https://stackoverflow.com/questions/38385419/throttle-amount-of-promises-open-at-a-given-time

  // We'll need to store which is the next promise in the list.
  let i = 0;
  const resultArray = new Array(listOfCallableActions.length);

  // Now define what happens when any of the actions completes. Javascript is
  // (mostly) single-threaded, so only one completion handler will call at a
  // given time. Because we return doNextAction, the Promise chain continues as
  // long as there's an action left in the list.
  function doNextAction(): Promise<any> {
    if (i < listOfCallableActions.length) {
      // Save the current value of i, so we can put the result in the right place
      const actionIndex = i++;
      const nextAction = listOfCallableActions[actionIndex];
      return Promise.resolve(nextAction())
        .then(result => {
          // Save results to the correct array index.
          resultArray[actionIndex] = result;
          return;
        })
        .then(doNextAction);
    } else {
      return Promise.resolve();
    }
  }

  // Now start up the original <limit> number of promises.
  // i advances in calls to doNextAction.
  const listOfPromises = [];
  while (i < limit && i < listOfCallableActions.length) {
    listOfPromises.push(doNextAction());
  }
  return Promise.all(listOfPromises).then(() => resultArray);
}

function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

function isRoundedHour(date: Date): boolean {
  return date.getTime() == new Date(date).setUTCMinutes(0, 0, 0);
}

function beginningOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function isBeginningOfAMonth(date: Date): boolean {
  return beginningOfMonth(date).getTime() === date.getTime();
}

function beginningOfADay(date: Date | number): Date {
  const millisecondsInDate = date instanceof Date ? date.getTime() : date;
  const startOfThisDay_UTC = Math.floor(millisecondsInDate / DAY_IN_MILISECOND) * DAY_IN_MILISECOND;
  return new Date(startOfThisDay_UTC);
}

function isBeginningOfADay(date: Date): boolean {
  return beginningOfADay(date).getTime() === date.getTime();
}

function beginningOfAWeek(date: Date, doesWeekBeginOnMonday = true): Date {
  const firstDayOfWeekIndex = doesWeekBeginOnMonday ? 1 : 0;
  const dayOfWeek = date.getDay();
  const firstDayOfWeek = new Date(date);
  const diff = dayOfWeek >= firstDayOfWeekIndex ? dayOfWeek - firstDayOfWeekIndex : 6 - dayOfWeek;

  firstDayOfWeek.setDate(date.getDate() - diff);
  firstDayOfWeek.setHours(0, 0, 0, 0);

  return firstDayOfWeek;
}

function isBeginningOfAYear(date: Date): boolean {
  return date.toISOString().substr(4, 20) === '-01-01T00:00:00.000Z';
}

function isBeginningOfAWeek(date: Date): boolean {
  return beginningOfAWeek(date).getTime() === date.getTime();
}

function beginningOfToday(): Date {
  return beginningOfADay(Date.now());
}

function beginningOfYesterday(): Date {
  const startOfYesterday_UTC = beginningOfToday().getTime() - DAY_IN_MILISECOND;
  return new Date(startOfYesterday_UTC);
}

function getListOfDatesInBetween(start: Date, end: Date) {
  const result = [];
  let realEndDate;
  if (start.getTime() != end.getTime() && end.getTime() == beginningOfADay(end).getTime()) {
    // Check if the time of 'end' is midnight. If yes - its date won't be returned.
    realEndDate = beginningOfADay(new Date(end.getTime() - 1));
  } else {
    realEndDate = beginningOfADay(end);
  }

  for (let i = beginningOfADay(start); i <= realEndDate; i = new Date(i.getTime() + DAY_IN_MILISECOND)) {
    result.push(i.toISOString().slice(0, 10));
  }
  return result;
}

function createDeltaDate(
  minutes: number,
  hours: number,
  days: number,
  months: number,
  years: number,
  fromDate = new Date()
): Date {
  const date = new Date(fromDate);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  date.setUTCHours(date.getUTCHours() + hours);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCMonth(date.getUTCMonth() + months);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date;
}

function verifyLeadingZeros(dateStr: string | Date | number): string {
  const OCT = 9;
  const tmpDate = new Date(dateStr);
  const m = (tmpDate.getUTCMonth() >= OCT ? '' : '0') + (tmpDate.getUTCMonth() + 1);
  const d = (tmpDate.getUTCDate() >= 10 ? '' : '0') + tmpDate.getUTCDate();
  return tmpDate.getUTCFullYear() + '-' + m + '-' + d;
}

function convertBirthdateToAge(birthdate: string | Date | number): number {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function calculateEndDate(endDate: Date): string {
  if (isValidDate(endDate)) {
    const beginningOfTheDay = new Date(endDate.toISOString().substring(0, 10));
    let resultString = endDate;
    if (beginningOfTheDay.getTime() == endDate.getTime()) {
      resultString = new Date(endDate.getTime() - DAY_IN_MILISECOND);
    }
    return verifyLeadingZeros(resultString);
  } else {
    throw new Error(`endDate is not a valid date: ${endDate}!`);
  }
}

function thorwIfNotOverridden(): void {
  throw new Error('Function must be overridden!');
}

function isProd(): boolean {
  return process.env.NODE_ENV == 'production';
}

export default {
  consoleError,
  consoleLog,
  consoleDebug,
  getFullUrlFromReqObj,
  convertRequestToString,
  addGetterToClass,
  runCLI,
  // flatObject,
  objectToQueryParamsString,
  exctractUserIpFromReq,
  mergeAndRemoveDuplicates,
  convertArrayIntoObject,
  isNumeric,
  round,
  roundAndFormat,
  getFunctionUniqeName,
  genRand,
  genRandId_lettersAndNumbers,
  cartesianProduct,
  tryParseJSON,
  convertToString,
  whatIsIt,
  ip_to_num,
  getMyExternalIP,
  dupicateJson,
  isReallyTrue,
  includesOneOfTheseValues,
  PromiseAll_throttled,
  thorwIfNotOverridden,
  isProd,
  date: {
    isValidDate,
    isRoundedHour,
    beginningOfMonth,
    beginningOfADay,
    beginningOfToday,
    beginningOfYesterday,
    isBeginningOfAMonth,
    isBeginningOfADay,
    beginningOfAWeek,
    isBeginningOfAWeek,
    isBeginningOfAYear,
    getListOfDatesInBetween,
    createDeltaDate,
    verifyLeadingZeros,
    convertBirthdateToAge,
    calculateEndDate,
    DAY_IN_MILISECOND,
  },
};
