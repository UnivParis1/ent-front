"use strict";

var THEME_COOKIE_NAME = "ProlongationENT_theme";

function setThemeCookie(theme) {
  document.cookie = THEME_COOKIE_NAME + "=" + theme + ";domain=.univ-paris1.fr;path=/" + (theme ? '' : ";expires=Thu, 01 Jan 1970 00:00:01 GMT;");
}

if (window.parent != window) {
  // no iframe
  window.top.location.href = document.location;
}

setThemeCookie('theme-paris1-2016');

window.bandeau_ENT = { current: "caccueil", no_titlebar: true, delegateAuth: true };

var pE, h, latestTopApps, tags;
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

var diacriticsMap = [
      {'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
      {'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
      {'base':'I', 'letters':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
      {'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
      {'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
      {'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
      {'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
      {'base':'i', 'letters':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
      {'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
      {'base':'u','letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
];

function asciifie(s) {
    if (!s) return s;
    diacriticsMap.forEach(function (v) {
	s = s.replace(v.letters, v.base);
    });
    return s;
}

function tomorrow() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
}

function raw_xhr(url) {
    var req = new XMLHttpRequest();
    if (!req) return;
    req.open("GET", url, true);
    req.responseType = 'text';
    req.send(null);
}
var timeoutID;
function server_log(msg) {
    if (timeoutID) window.clearTimeout(timeoutID);
    timeoutID = setTimeout(function () {
        raw_xhr("log?" + msg);
    }, 750);
}


function sessionStorageGet(field) {
    try {
        var s = sessionStorage.getItem(field);
        var o = s && JSON.parse(s);
        if (o && o.expire > h.now()) return o.v;
    } catch (err) {}
    return null;
}
function sessionStorageSet(field, value, lifetime) {
    try {
        sessionStorage.setItem(field, JSON.stringify({ expire: lifetime.getTime(), v: value }));
    } catch (err) {}
}

function formatAppField(s) {
  s = h.escapeQuotes(s);
  return searchAnyWords ? s.replace(searchAnyWords, function (word) {
    return "<b>" + word + "</b>";
  }) : s;
}

function computeLink(app) {
  var url = app.url;
  var description = app.description || app.title;
  var a = "<a title='" + h.escapeQuotes(description) + "' href='" + url + "'>" +
           "<span class='title'>" +
             "<img src='" + pE.CONF.prolongationENT_url + "/" + pE.CONF.theme + "/icon/" + simplifyFname(app.fname) + ".svg' onerror='this.style.display=\"none\"' >" +
             "<span class='title-text'>" + formatAppField(app.text || app.title) + "</span>" +
           "</span>" +
           "<span class='description'>" + formatAppField(description) + "</span>" +
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
  app = asciifie(objectValues(app).join(','));
  return simpleEvery(searchWords, function (re) {
    return app.match(re);
  });
}

function setSearchWords(toMatch) {
    toMatch = asciifie(toMatch);
    var words = h.simpleFilter(toMatch.split(/\s+/), function (e) { return e !== '' });
    searchWords = h.simpleMap(words, function (word) { return new RegExp(word, "i"); });
    searchAnyWords = new RegExp(words.join('|'), 'i');
}

function displayLinks() {
  var done = { caccueil: true, 'accueil-2016': true };

  h.simpleQuerySelector("#liste-tags-inner").innerHTML = h.simpleMap(tags, function (tag) {
      var className = asciifie(tag).match(searchWords.length ? searchAnyWords : 'Tous') ? 'selected' : '';
        return "<a href='#" + tag + "' class='" + className + "'>" + tag + "</a>";
  }).join(' ');
    
  function computeLinks(appIds) {    
    var l = [];
    h.simpleEach(appIds, function (appId) {
      if (done[appId]) return;
      done[appId] = true;
      var app = pE.validApps[appId];
      if (app && app.tags[0] === "__hidden__") return;
      //if (!app) console.log("not found " + appId);
      if (app && matches_search(app)) l.push(computeLink(app));
    });
    return l;
  }
    function block(links) {
        return "<ul>" + links.join('') + "<li class='padding'></li><li class='padding'></li><li class='padding'></li><li class='padding'></li><li class='padding'></li>" + "</ul>";
    }

    var l = computeLinks((latestTopApps ? normalizeAppIds(latestTopApps) : []).concat(Object.keys(pE.validApps)));
    var nbFirst = 3*4;
    var html = block(l.slice(0, nbFirst)) +
        (l.length > nbFirst ? block(l.slice(nbFirst)) : '');
  h.simpleQuerySelector(".liste-service").innerHTML = html;   
    return l.length;
};

window.onLoadTopApps = function (DATA) {
  if (DATA && DATA.topApps) {
    latestTopApps = DATA.topApps;
    sessionStorageSet("latestTopApps:" + pE.DATA.user, latestTopApps, tomorrow());
  }
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

function useHashParam() {
    var value = document.location.hash && decodeURIComponent(document.location.hash.replace(/^#/, '')); 
    if (value) {
        if (value === 'Tous') value = '';
        var search_input = h.simpleQuerySelector('.search input');
        search_input.value = '';
        setSearchWords(value);
        displayLinks();
        
    }
}

function withInfo() {
  // remove splash screen
  document.getElementById("loading").className = "hidden";

  h.simpleQuerySelector('#pE-header .pE-title-ent').innerHTML = '';
  h.simpleQuerySelector('#pE-header .pE-title-app-long').innerHTML = 'Environnement numérique de travail (ENT)';
  h.simpleQuerySelector('#pE-header .pE-title-app-short').innerHTML = 'ENT';

  var search_input = h.simpleQuerySelector('.search input');
  if (search_input.value) setSearchWords(search_input.value);
  search_input.oninput = function () {
    document.location.hash = '';
    setSearchWords(this.value);
    var nbApps = displayLinks();
    if (this.value.length > 2) server_log("user=" + encodeURIComponent(pE.DATA.user) + "&results=" + nbApps + "&search=" + encodeURIComponent(this.value));
  };
    
  latestTopApps = sessionStorageGet("latestTopApps:" + pE.DATA.user);
  if (latestTopApps) {
      displayLinks();
  } else {
      loadBandeauJs(['latestTopApps']);
  }
}

function addTags() {
    tags = ["Tous"];
    h.simpleEach(pE.DATA.layout.folders, function (tab) {
        h.simpleEach(tab.portlets, function (app) {
            if (!app.tags) app.tags = [];
            app.tags.unshift(tab.title);
        });
        if (tab.title !== 'Accueil' && tab.title !== 'Intranet' && tab.title !== 'Assistance'  && tab.title !== 'Administrateurs') tags.push(tab.title);
    });    
}

window.bandeau_ENT.onload = function (pE_) {
  pE = pE_;
  h = pE.helpers;    
  addTags();
    
  useHashParam();
  window.onhashchange = useHashParam;

  withInfo();
};
