"use strict";
let SESSIONTIMEOUT, SESSIONTIMEOUT2 = null;
function byId(name) {
  return document.getElementById(name);
}
function globalOnload(cbk) {
  var script = document.createElement("script");
  script.src = "./nodemodules/dialog-polyfill/dist/dialog-polyfill.js";
  document.head.appendChild(script);
  document.onkeydown = keydown;
  document.body.addEventListener("mouseover", mouseOver);
  send(
    JSON.stringify({ action: "userRequest" }),
    (res) => {
      document.documentElement.className = res.data.darkQ ? "dark" : "";
      console.log("Loading complete; updating class");
      let maincontent = document.getElementsByClassName("main_content").item(0);
      let ftr = document.createElement("footer");
      maincontent.appendChild(ftr);
      let ele2 = document.createElement("p");
      ele2.id = "footer";
      if (res.status != "SUCCESS")
        ele2.innerHTML = `<a href="/login?redirect=${window.location.pathname}">Login</a> | 
                      <a href='/signup'>Sign-up</a> | 
                      <a href='/status'>Status</a> | 
                      BetaOS Systems V2, 2023`;
      else {
        resetExpiry(res);
        ele2.innerHTML = `Logged in as <kbd>${res.data.user}</kbd> |
                      <a href='/logout'>Logout</a> | 
                      <a href='/config'>Account</a> | 
                      <a href='/status'>Status</a> | 
                      <a href='javascript:send(JSON.stringify({action:"toggleTheme"}), (res)=>{if (res.status != "SUCCESS") alertDialog("Error: "+res.data.error, ()=>{});else {alertDialog("Theme updated!", ()=>{location.reload()}); }})'>Theme</a> |
                      BetaOS Systems V2, 2023`;
      }
      ftr.appendChild(ele2);
      send(
        JSON.stringify({ action: "visits" }),
        (res2) => {
          if (res2.status != "SUCCESS") {
            alertDialog("Database connection failure. Please contact BetaOS.", () => {
            });
            ele2.innerHTML = `<kbd class="red nohover">Database connection failure.</kbd>`;
          }
          document.getElementById("footer").innerHTML += " | <kbd>" + res2.data.data + "</kbd>";
          send(JSON.stringify({ action: "cookieRequest" }), (res3) => {
            if (res3.data.toString() == "false") {
              let cpl = document.getElementById("compliance");
              cpl.style.opacity = "1";
              cpl.style.pointerEvents = "auto";
            } else {
              let cpl = document.getElementById("compliance");
              cpl.style.opacity = "0";
              cpl.style.pointerEvents = "none";
            }
            if (cbk)
              cbk();
          }, true);
        },
        true
      );
    },
    true
  );
  let ele = document.getElementById("");
  document.body.innerHTML += `
  <div id="compliance">
    <h2 class="blu nohover"><span class="material-symbols-outlined">cookie </span> BetaOS Services uses cookies to operate.</h2>
    <p>We use only <kbd>strictly necessary cookies</kbd> to verify and persist 
    your login session, and to confirm your acceptance of these cookies. <br>
    By continuing to use this site, you consent to our use of these cookies.</p>
    <button class='blu btn fsmed' onclick="acceptCookies()">
    <span class="material-symbols-outlined">check</span>
    I understand
    <div class="anim"></div>
    </button>
  </div>`;
}
function send(params, callback, onLoadQ = false) {
  let overlay2 = document.getElementById("overlayL");
  console.log(onLoadQ);
  if (overlay2 && !onLoadQ) {
    console.log("overlay active");
    overlay2.style.opacity = "1";
    overlay2.style.backgroundColor = "var(--system-overlay)";
  }
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/server", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (overlay2) {
        overlay2.style.opacity = "0";
        overlay2.style.backgroundColor = "var(--system-grey2)";
      }
      if (failureTimeout)
        clearTimeout(failureTimeout);
      failureTimeout = null;
      callback(JSON.parse(xhr.responseText));
    } else if (xhr.readyState == 4 && xhr.status != 200) {
      if (failureTimeout)
        clearTimeout(failureTimeout);
      failureTimeout = null;
      alertDialog("Received status code " + xhr.status + " - resend request?", () => {
        send(params, callback, onLoadQ);
      }, 2);
    }
  };
  console.log(params);
  xhr.send(params);
  let failureTimeout = setTimeout(() => alertDialog(`This is taking longer than expected.`, () => {
  }, 1, params), 5e3);
}
function acceptCookies() {
  send(JSON.stringify({ action: "acceptCookies" }), (res) => {
  });
  let cpm = document.getElementById("compliance");
  cpm.style.opacity = "0";
  cpm.style.pointerEvents = "none";
}
let dialogQ = false;
function alertDialog(str, callback = () => {
}, button = -1, failedReq = "") {
  let newDialog = document.createElement("dialog");
  dialogPolyfill.registerDialog(newDialog);
  document.body.appendChild(newDialog);
  newDialog.className = "internal ALERT";
  newDialog.id = "internal_alerts";
  newDialog.style.opacity = "0";
  newDialog.style.textAlign = "center";
  newDialog.innerHTML = `
    <p class="fsmed" id="alerttext_v2">Error: AlertDialog configured incorrectly. Please contact BetaOS.</p>
    <div style="text-align: center;"><button id="confirmbtn" class="btn szHalf override" onclick="console.log('ConfirmClick'); closeAlert(1)" style="display: inline-block">
      <span class="alertlbl">Continue</span>
      <span class="material-symbols-outlined">arrow_forward_ios</span>
      <div class="anim"></div>
    </button>
    <button class="btn szHalf red override" id="cancelBtn" style="display: none" onclick="console.log('RejectClick'); closeAlert(-1)">
      <span class="alertlbl">Cancel</span>
      <span class="material-symbols-outlined">cancel</span>
      <div class="anim"></div>
    </button></div>`;
  setTimeout(() => {
    newDialog.style.opacity = "1";
    newDialog.style.top = "18px";
  }, 0);
  newDialog.setAttribute("type", button + "");
  newDialog.callback = callback;
  let overlay2 = document.getElementById("overlayL");
  if (overlay2) {
    overlay2.style.opacity = "0";
  }
  let ele = document.getElementById("overlay");
  ele.innerHTML = "";
  let p = newDialog.querySelector("#alerttext_v2");
  if (!ele || !p) {
    console.log("ERROR: Alert dialogs not enabled in this page.");
    callback();
    return;
  }
  ele.style.opacity = "1";
  newDialog.style.opacity = "1";
  newDialog.style.pointerEvents = "auto";
  dialogQ = true;
  p.innerText = str;
  p.innerHTML += "<p style='margin: 10px auto' class='gry nohover'>(Press any key to dismiss)</p>";
  newDialog.querySelector("#cancelBtn").style.display = "none";
  if (button == 1) {
    p.innerHTML += `<button class='btn szThird fssml' id="refresh" onclick='location.reload()'>
    <span class="material-symbols-outlined">history</span> Refresh?
    <div class="anim"></div></button>`;
    console.log("Alert-type: FAILEDREQUEST" + failedReq);
  } else if (button == 2) {
    newDialog.querySelector("#cancelBtn").style.display = "inline-block";
    console.log("Alert-type CANCELLABLE");
  } else
    console.log("Alert-type: STANDARD");
  newDialog.showModal();
}
function closeAlert(sel) {
  let ele = document.getElementById("overlay");
  let coll = document.getElementsByClassName("ALERT");
  let dialog = coll.item(coll.length - 1);
  let overridecallback = false;
  if (dialog.getAttribute("type") == 2 && sel < 0)
    overridecallback = true;
  if (!ele) {
    console.log("Alert dialogs not enabled in this page");
    return;
  }
  dialog.style.top = "50vh";
  dialog.style.opacity = "0";
  dialog.style.pointerEvents = "none";
  if (!overridecallback)
    dialog.callback();
  dialog.remove();
  if (!byId("internal_alerts") && !DIALOGOPEN) {
    dialogQ = false;
    ele.style.opacity = "0";
    ele.style.pointerEvents = "none";
  }
}
function keydown(e) {
  if (dialogQ && (e.key == "Escape" || e.key == "Enter")) {
    e.preventDefault();
    if (e.key == "Escape") {
      console.log("RejectKey");
      closeAlert(-1);
    } else {
      console.log("ConfirmKey");
      closeAlert(1);
    }
  }
}
function toTime(ms) {
  let day = Math.floor(ms / 1e3 / 60 / 60 / 24);
  ms = ms % (1e3 * 60 * 60 * 24);
  let hr = Math.floor(ms / 1e3 / 60 / 60);
  ms = ms % (1e3 * 60 * 60);
  let min = Math.floor(ms / 1e3 / 60);
  ms = ms % (1e3 * 60);
  let sec = Math.floor(ms / 1e3);
  if (ms < 0)
    return "00:00:00";
  return (day > 0 ? day + "d " : "") + padWithZero(hr) + ":" + padWithZero(min) + ":" + padWithZero(sec);
}
function padWithZero(n) {
  return n < 10 ? "0" + n : n;
}
let overlay;
addEventListener("DOMContentLoaded", function() {
  overlay = document.createElement("div");
  overlay.className = "overlayLoader";
  overlay.id = "overlayL";
  overlay.style.backgroundColor = "var(--system-overlay)";
  overlay.style.opacity = "1";
  overlay.innerHTML = `<span class="material-symbols-outlined loader">sync</span>
  <p class="loadp fslg grn nohover">Loading.</p>`;
  document.body.appendChild(overlay);
  let metatags = document.createElement("meta");
  metatags.content = "width=device-width; initial-scale=1.0; min-scale=1.0";
  metatags.name = "viewport";
  document.head.appendChild(metatags);
});
let DIALOGOPEN = false;
function closeDialog(thing, name = "dialog") {
  let div = document.getElementById(name);
  div.style.top = "50%";
  div.style.opacity = "0";
  div.style.pointerEvents = "none";
  DIALOGOPEN = false;
  document.getElementById("overlay").style.opacity = "0";
  thing();
}
function openDialog(name = "dialog") {
  let div = document.getElementById(name);
  div.style.top = "0px";
  div.style.opacity = "1";
  div.style.pointerEvents = "auto";
  DIALOGOPEN = true;
  document.getElementById("overlay").style.opacity = "1";
}
function mouseOver(e) {
  let ele = e.target;
  let text = ele.innerHTML.replaceAll(/<.*((>.*<\/.*>)|(\/>))/gmiu, "").replaceAll("\n", "").trim();
  if (ele.className.match(/(\W|^)btn(\W|$)/)) {
    let tooltip = ele.children.namedItem("TOOLTIP");
    if (!tooltip) {
      tooltip = document.createElement("span");
      tooltip.innerText = text;
      tooltip.id = "TOOLTIP";
      tooltip.className = "TOOLTIP override";
      ele.appendChild(tooltip);
      ele.style.animation = "none";
      ele.offsetHeight;
      ele.style.animation = null;
    }
  }
}
function resetExpiry(res) {
  if (res.data.expiry < Date.now()) {
    return;
  }
  SESSIONTIMEOUT = setTimeout(() => {
    alertDialog("Your session has expired", () => {
      location.reload();
    });
  }, res.data.expiry - Date.now());
  SESSIONTIMEOUT2 = setTimeout(() => {
    alertDialog("Your session is expiring in one minute, extend session? ", () => {
      send(JSON.stringify({ action: "extendSession" }), (res2) => {
        alertDialog("Session extended, expires in " + toTime(res2.data.expiry - Date.now()), () => {
        });
        clearTimeout(SESSIONTIMEOUT);
        clearTimeout(SESSIONTIMEOUT2);
        resetExpiry(res2);
      });
    }, 2);
  }, Math.max(res.data.expiry - Date.now() - 6e4, 1e3));
}
//# sourceMappingURL=utils.js.map
