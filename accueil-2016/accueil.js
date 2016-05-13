"use strict";

var THEME_COOKIE_NAME = "ProlongationENT_theme";

function setThemeCookie(theme) {
  document.cookie = THEME_COOKIE_NAME + "=" + theme + ";domain=.univ-paris1.fr;path=/" + (theme ? '' : ";expires=Thu, 01 Jan 1970 00:00:01 GMT;");
  document.location.reload();
}

if (window.parent != window) {
  // no iframe
  document.location = 'https://ent-test.univ-paris1.fr/accueil/';
}

window.bandeau_ENT = { current: "caccueil", no_titlebar: true };

var pE, h, latestTopApps
var searchWords = [];
var searchAnyWords;
var inProgress;

function simpleEvery(a, fn) {
   var len = a.length;
   for(var i = 0; i < len; i++) {
       if (!fn(a[i])) return false;
   }
   return true;
}

function objectValues(a) {
    var r = [];
    for(var k in o) {
        r.push(o[k]);
    }
    return r;
}

function objectValues(o) {
    return h.simpleMap(Object.keys(o), function (k) { return o[k]; });
}

function formatAppField(s) {
  s = h.escapeQuotes(s);
  return searchAnyWords ? s.replace(searchAnyWords, function (word) {
    return "<b>" + word + "</b>";
  }) : s;
}

function computeLink(app) {
  var url = app.url;
  var a = "<a title='" + h.escapeQuotes(app.description) + "' href='" + url + "'>" +
           "<span class='title'>" +
             "<img src='" + pE.CONF.prolongationENT_url + "/" + pE.CONF.theme + "/icon/" + simplifyFname(app.fname) + ".png' onerror='this.style.display=\"none\"' >" +
             "<span class='title-text'>" + formatAppField(app.text || app.title) + "</span>" +
           "</span>" +
           "<span class='description'>" + formatAppField(app.description) + "</span>" +
           "</a>";
  return "<li>" + a + "</li>";
}

// in our Agimus, we simplify the fnames, we must handle this
function simplifyFname(k) {
  k = k.replace(/^C([A-Z])/, "$1").replace(/-(etu|ens|gest|pers|teacher|default)$/, '');
  return k.toLowerCase();
}

function normalizeAppIds(appIds) {
    var map = {};
    h.simpleEachObject(pE.validApps, function (k, app) { 
        map[simplifyFname(k)] = k;
    });
    return h.simpleMap(appIds, function (appId) {
        return map[simplifyFname(appId)] || appId;
    });
}

function matches_search(app) {
  if (searchWords.length === 0) return true;
  app = objectValues(app).join(',');
  return simpleEvery(searchWords, function (re) {
    return app.match(re);
  });
}

function setSearchWords(toMatch) {
    var words = h.simpleFilter(toMatch.split(/\s+/), function (e) { return e !== '' });
    searchWords = h.simpleMap(words, function (word) { return new RegExp(word, "i"); });
    searchAnyWords = new RegExp(words.join('|'), 'i');
}

function displayLinks() {
  var l = [];
  var done = { caccueil: true };
    
  function computeLinks(appIds) {    
    var l = [];
    h.simpleEach(appIds, function (appId) {
      if (done[appId]) return;
      done[appId] = true;
      var app = pE.validApps[appId];
      //if (!app) console.log("not found " + appId);
      if (app && matches_search(app)) l.push(computeLink(app));
    });
    return "<ul>" + l.join('') + "<li class='padding'></li><li class='padding'></li><li class='padding'></li><li class='padding'></li><li class='padding'></li>" + "</ul>";
  }

  var html = latestTopApps && computeLinks(normalizeAppIds(latestTopApps)) || '';
  html += computeLinks(Object.keys(pE.validApps));
  h.simpleQuerySelector(".liste-service").innerHTML = html;   
};

window.onLoadTopApps = function (DATA) {
  if (DATA && DATA.topApps) latestTopApps = DATA.topApps;
  if (inProgress) {
    inProgress = false;
    displayLinks();
  }
};

var loadBandeauJs = function(params) {
   inProgress = true;
   if (pE.wanted_uid)
       params.push("uid=" + encodeURIComponent(pE.wanted_uid));    
   params.push("callback=window.onLoadTopApps");
   h.loadScript(pE.CONF.layout_url + (params.length ? "?" + params.join('&') : ''));
   setTimeout(function () {
    window.onLoadTopApps();
   }, 1000);

};

function withInfo() {
  // cool, we logged in. now we can clean url
  if (document.location.hash) document.location.hash = '';

  // remove splash screen
  document.getElementById("loading").className = "hidden";

  h.simpleQuerySelector('#pE-header .pE-title-ent').innerHTML = '';
  h.simpleQuerySelector('#pE-header .pE-title-app-long').innerHTML = 'Environnement numérique de travail (ENT)';
  h.simpleQuerySelector('#pE-header .pE-title-app-short').innerHTML = 'ENT';

  var search_input = h.simpleQuerySelector('.search input');
  setSearchWords(search_input.value);
  search_input.oninput = function () {
    setSearchWords(this.value);
    displayLinks();
  };
  
  loadBandeauJs(['latestTopApps']);
}

if (!document.location.hash.match(/login/)) {
  window.bandeau_ENT.onNotLogged = function (pE) {
    document.location = pE.CONF.cas_login_url + "?service=" + encodeURIComponent(document.location + "#login");
  };
}

window.bandeau_ENT.onload = function (pE_) {
  pE = pE_;
  h = pE.helpers;
  withInfo();
};
