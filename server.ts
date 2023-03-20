const express = require('express')
const app = express()
const crypto = require("crypto");
const parse = require("co-body");
 // for generating secure random #'s
import {K} from './consts';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const urlencodedParser = bodyParser.urlencoded({ extended: false }) 
var RateLimit = require('express-rate-limit');

export async function initServer() {
  var limiter = RateLimit({
    windowMs: 10*1000, // 10 seconds
    max: 50,
    message: "Too many requests, please try again later.",
    statusCode: 429, // 429 status = Too Many Requests (RFC 6585)
  });
  app.use(limiter);
  app.use(new cookieParser());
  
  app.get('/', (req:Request, res:any) => {
    res.sendFile(K.frontendDir+'/index.html')
  })

  app.get('/login', (req:any, res:any) => {
    res.sendFile(K.frontendDir+'/login.html');
  });

  app.get('/signup', (req:any, res:any) => {
    res.sendFile(K.frontendDir+'/signup.html');
  });

  app.get('/config', (req:any, res:any) => {
    res.sendFile(K.frontendDir+'/config.html');
  });
    
  app.get('*/favicon.ico', (req:Request, res:any)=> {
    res.sendFile(K.rootDir+'/favicon.ico')
  })
  
  app.get('/*.js*', (req:any, res:any) => {
    res.sendFile(K.jsDir+req.url);
  })
  
  app.get('/*.ts', (req:any, res:any) => {
    res.sendFile(K.jsDir+req.url);
  })

  app.get('/*.css', (req:any, res:any) => {
    res.sendFile(K.frontendDir+req.url);
  })

  app.get('/*', (req:any, res:any) => {
    res.sendFile(K.frontendDir+"404.html");
  })
  
  
  app.post('/server', urlencodedParser, async (req:any, res:any) => {
    
    var body = await parse.json(req);
    if (!body) res.end(JSON.stringify({status:"ERROR", data:null}));
    console.log(req.cookies.sessionID);
    // let cookiematch = req.cookies.match("sessionID=[0-9a-zA-Z\\-]");
    makeRequest(body.action, req.cookies.sessionID, body.data, (s:string, d:any, token:string)=>{
      res.cookie('sessionID', token, { maxAge: 1000*60*60*24*30, httpOnly: true, secure:true, sameSite:"Strict"});
      console.log(d);
      res.end(JSON.stringify({status:s, data:d}));
    })
  });
  
  app.listen(K.port, () => {
    console.log(`BetaUtilities V2 listening on port ${K.port}`)
  })
}

function makeRequest(action:string|null, token:string, data:any|null, callback: (status:string, data:any, token:string)=>any) {
  switch (action) {
    case 'test':
      callback("SUCCESS", {abc:"def", def:5}, token);
      break;
    case 'login': 
      // validate login-data before sending to server
      data = data as {user:string, pass:string};
      console.log(data);
      validateLogin(data.user, data.pass, callback, token);
      break;
    case 'signup':
      data = data as {user:string, pass:string};
      signup(data.user, data.pass, callback, token);
      break;
    case 'userRequest': 
      userRequest(callback, token);
      break;
    default:
      callback("ERROR", {error: "Unknown command string!"}, token);
  }
  return; 
}
const argon2 = require('argon2');
// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html


async function validateLogin(user:string, pwd:string, callback:(status:string, data:any, token:string)=>any, token:string) {
  let start = Date.now();
  if (!user.match(K.userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
  }
  if (pwd.length == 0) {
    callback("ERROR", {error:"No password provided!"}, token)
    return;
  }
  let usrInfo = await K.authDB.findOne({fieldName:"UserData", user:{$eq:user}}) as {pwd:string, permLevel:number};
  if (!usrInfo) {
    callback("ERROR", {error:"No such user!"}, token); // keep the original token.
    return;
  }
  else if (await argon2.verify(usrInfo.pwd, pwd)) {
    let uuid = crypto.randomUUID() // gen new token
    console.log("Verified in "+(Date.now() - start)+"ms");
    start = Date.now();
    let userData:{permLevel:number} = await K.authDB.findOne({fieldName:"UserData", user:user});
    await K.authDB.insertOne({fieldName:"Token", associatedUser:user, token:uuid, expiry: Date.now()+K.expiry[userData.permLevel]})
    callback("SUCCESS", {perms: usrInfo.permLevel}, uuid);
    console.log("Completed in "+(Date.now() - start)+"ms");
    return;
  } else {
    callback("ERROR", {error:"Password is invalid!"}, token);
    return;
  }
}

async function signup(user:string, pwd:string, callback:(status:string, data:any, token:string)=>any, token:string) {
  if (!user.match(K.userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
  }
  if (pwd.length == 0) {
    callback("ERROR", {error:"No password provided!"}, token)
    return;
  }
  let usrInfo = await K.authDB.findOne({fieldName:"UserData", user:user}) as {pwd:string, permLevel:number};
  if (usrInfo) {
    callback("ERROR", {error:"User is registered"}, token) // keep the original token.
    return;
  }
  else {
    let hash = await argon2.hash(pwd, K.hashingOptions); 
    await K.authDB.insertOne({fieldName:"UserData", user:user, pwd:hash, permLevel: 1});
    validateLogin(user, pwd, callback, token);
    return;
  }
}

async function userRequest(callback:(status:string, data:any, token:string)=>any, token:string) {
  let tokenData:{associatedUser:string, expiry:number} = await K.authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    callback("ERROR", {error:"Your session could not be found!"}, token)
    return;
  }
  let userData:{permLevel:number} = await K.authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (Date.now() > tokenData.expiry) {
    callback("ERROR", {error:"Your session has expired!"}, token)
    return;
  }
  callback("SUCCESS", {user: tokenData.associatedUser, perms:userData.permLevel, expiry: tokenData.expiry}, token);
}