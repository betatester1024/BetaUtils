const argon2 = require('argon2');
// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
import {authDB, userRegex, expiry} from './consts';

export async function userRequest(token:string, internalFlag:boolean=false) {
  if (token == "[SYSINTERNAL]" && internalFlag) return {status:"SUCCESS", data:{user:"BetaOS_System", alias:"BetaOS_System", perms:3, expiry:9e99, tasks: [], darkQ:false}, token:"SYSINTERNAL"}
  let tokenData:{associatedUser:string, expiry:number} = await authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    return {status:"ERROR", data:{errorCode: 0, error:"Your session could not be found!"}, token:""}
  }
  let userData:{permLevel:number, alias:string, darkTheme:boolean} = await authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (Date.now() > tokenData.expiry) {
    return {status:"ERROR", data:{errorCode: 0, error:"Your session has expired!"}, token:""};
  }
  return {status:"SUCCESS", data: {
    user: tokenData.associatedUser, 
    alias:userData.alias??userData.user, 
    perms:userData.permLevel, 
    expiry: tokenData.expiry, 
    tasks:userData.tasks, 
    darkQ:userData.darkTheme??false, 
    lastCl:userData.lastClicked,
    branch: process.env.branch
  }, token:token};
}


export async function extendSession(token:string) {
  let tokenData:{associatedUser:string, expiry:number} = await authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    return {status:"ERROR", data:{error:"Your session could not be found!"}, token:""}
  }
  let userData:{permLevel:number, alias:string, darkTheme:boolean} = await authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (Date.now() > tokenData.expiry) {
    return {status:"ERROR", data:{error:"Your session has expired!"}, token:""};
  }
  let newExpiry = expiry[userData.permLevel]+Date.now();
  await authDB.updateOne({fieldName:"Token", token:token}, {$set:{expiry:newExpiry}});
  return {status:"SUCCESS", data: {expiry: newExpiry}, token:token};
}


export async function userListing(token:string) 
{
  
}