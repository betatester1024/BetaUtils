// we have a front-end!
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');  
// Create application/x-www-form-urlencoded parser  
const urlencodedParser = bodyParser.urlencoded({ extended: false })  
const app = express();
const port = 4000;
import {rooms} from './messageHandle';
import { validate } from './accessControl';
import {systemLog} from './misc';
export function updateServer() { 
  systemLog("");
  systemLog("Server active!")
  
  app.get('/', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'index.html' ));
  });
  app.get('/favicon.ico', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'favicon.ico' ));
  });
  app.get('/NotoSansDisplay-Variable.ttf', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'NotoSansDisplay-Variable.ttf' ));
  });
  app.get('/status/status_raw.html', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'status_raw.html' ));
  });
  
  app.get('/frontend.js', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../.build/frontend', 'frontend.js' ));
  });

  app.get('/login.js', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../.build/frontend', 'login.js' ));
  });

  app.get('/login', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'login.html' ));
  });

  app.get('/admin', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'admin.html' ));
  });

  app.get('/logout', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'logout.html' ));
  });

  app.get('/signup', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'signup.html' ));
  });
  
  app.post('/login', urlencodedParser, function (req:any, res:any) {  
   // Prepare output in JSON format  
    if (req.body.action == "bMsg") res.end(JSON.stringify("ACCESS"));
    validate(decodeURIComponent(req.body.user) as string, decodeURIComponent(req.body.pass) as string, req.body.action, req.body.access as string, res, req.body.token as string)
   
  });

  app.get('/status', (req:any, res:any) => {
    let str = "BetaUtilities is in: <a href='/support'>Online Support</a>";
    for (let j = 0; j < rooms.length - 1; j++) { 
      str += `, <a href="https://euphoria.io/room/${rooms[j]}">&${rooms[j]}</a>` ; 
    }
    str += ` ${rooms.length>1?"and ":""}<a href="https://euphoria.io/room/${rooms[rooms.length-1]}">&${rooms[rooms.length-1]}</a>!  `;
    if (rooms.length == 0) {
      str = "ERROR";
    } // rooms failed
    fs.writeFileSync("frontend/status_raw.html",str);
    res.sendFile(path.join( __dirname, '../frontend', 'status.html' ));
  });

  app.get("/globalformat.css", (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'globalformat.css' ));
  }); 

  app.get("/support", (req:any, res:any) => {
    validate("", "", "checkAccess", "", res, req.query.token)
  })
  
  app.get("/syslog", (req:any, res:any) => {
    validate("", "", "checkAccess_A", "", res, req.query.token)
  })

  app.get('/about', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'about.html' ));
  });

  app.get('/contact', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'contact.html' ));
  });

  app.get('/*', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', '404.html' ));
  });

  // app.use(function(req:any, res:any, next:any) {
  //     res.status(404).render('frontend/landing.html');
  // });
  // app.get()
  
  app.listen(port, () => {
    systemLog(`Front-end is running on ${port}.`);
  });
}