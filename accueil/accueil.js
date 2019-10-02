"use strict";

if (window.parent != window) {
  // no iframe
  window.top.location.href = document.location;
}

var pE_args = window.prolongation_ENT_args = { currentAppIds: [ "caccueil", "accueil-federation" ], no_titlebar: true };

var IMPERSONATE_COOKIE = 'CAS_TEST_IMPERSONATE';
var m;
if (m = document.cookie.match(new RegExp(IMPERSONATE_COOKIE + "=(\\w+)"))) {
    pE_args.uid = m[1];
}

if (location.search && location.search.match(/federation/)) {
    var host = document.location.host.replace(/^ent/, 'esup');
    pE_args.layout_url = "https://" + host + "/federation/ProlongationENT/layout";
    pE_args.onNotLogged = function () {
        var m = location.search.match(/idpId=([^&]+)/);
        var idpParam = m ? "&entityID=" + m[1] : '';
        document.location = "https://" + host + "/Shibboleth.sso/Login?target=" + encodeURIComponent("/accueil/?federation") + idpParam;
    };
} else {
    pE_args.delegateAuth = true;
}

var pE, h, latestTopApps, tabTitles;
var rawSearch, searchAnyWords;
var inProgress;
var favorites;

function simpleEvery(a, fn) {
   var len = a.length;
   for(var i = 0; i < len; i++) {
       if (!fn(a[i])) return false;
   }
   return true;
}

function eltIndex(elt) {
    return [].indexOf.call(elt.parentElement.children, elt);
}

function objectValues(o) {
    return h.simpleMap(Object.keys(o), function (k) { return o[k]; });
}

function filterNull(l) {
    return h.simpleFilter(l, function (v) { return v });
}

function debounce(func, wait) {
    var timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = null;
            func();
        }, wait);
    };
}

function setClassIfNonBottom(elt, className) {
    function check() {
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
            h.removeClass(elt, className);
        } else {
            elt.className += " " + className;
        }
    }
    var check_ = debounce(check, 20);
    setTimeout(function () {
        window.addEventListener('scroll', check_);
        window.addEventListener('resize', check_);
        if (window.MutationObserver) {
            new MutationObserver(check_).observe(document, { childList: true, subtree: true });
        }
    });
    check();
}

function tomorrow() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
}

function location_hash() {
    return document.location.hash && decodeURIComponent(document.location.hash.replace(/^#/, ''))
}

function xhr(url, method, options, body, callback) {
    var req = new XMLHttpRequest();
    if (!req) return;
    req.open(method, url, true);
    var k;
    for (k in options) req[k] = options[k];
    if (callback) {
        req.onload = function () {
            var resp = req.response;
            if (req.status === 200) {
                if (options.responseType === 'json' && typeof resp === 'string') {
                    // workaround for MSIE
                    resp = JSON.parse(resp);
                }
                callback(null, resp);
            } else {
                callback(resp);
            }
        };
    }
    req.send(body);
}
function raw_xhr(url) {
    return xhr(url, 'GET', { responseType: 'text' }, null, undefined);
}
var timeoutID;
function server_log_async(params) {
    if (timeoutID) window.clearTimeout(timeoutID);
    timeoutID = setTimeout(function () {
        server_log(params);
    }, 750);
}
function server_log(params) {
    var l = [];
    h.simpleEachObject(params, function (k, v) {
        l.push(k + "=" + encodeURIComponent(v));
    });
    raw_xhr("log?" + l.join("&"));
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

function removeElement(elt) {
    elt.parentElement.removeChild(elt);
}



function formatAppField(s) {
  s = h.escapeQuotes(s);
  return searchAnyWords ? s.replace(searchAnyWords, function (word) {
    return "<b>" + word + "</b>";
  }) : s;
}

function iconUrl(appId) {
    var prefix = '/ProlongationENT/theme-paris1-2016/icon/';
    return prefix + appId + '.svg';
}

function onerror_iconUrl(elt) {
    var src = elt.src.replace(/[^/]*\.svg/, "default.svg");
    if (src !== elt.src) elt.src = src;
}

function computeLink(app) {
  var url = app.url;
//if (!url.match(/^http/)) url = pE.CONF.uportal_base_url + url.replace(/\/detached\//, "/max/");
  var description = app.description || app.title;
  var img = app.img || '<img class="icon" alt="" src="' + iconUrl(app.fname) + '" draggable="false" onerror="onerror_iconUrl(this)">';
  var add_or_remove_favorite = 
    h.simpleContains(favorites, app.fname) ?
        "<div class='removeFavorite' onclick='onclick_removeFavorite(event)' title='Supprimer des favoris'><img src='images/star.svg'></div>" :
        "<div class='addFavorite' onclick='onclick_addFavorite(event)' title='Ajouter aux favoris'><img src='images/star-o.svg' alt=''></div>";
  var a = "<a title='" + h.escapeQuotes(description) + "' href='" + url + "' data-fname='" + app.fname + "' draggable='false' >" +
           img +
           "<span>" + add_or_remove_favorite + 
             "<span class='title'>" +
               "<span class='title-text'>" + formatAppField(app.text || app.title) + "</span>" +
             "</span>" +
             "<span class='description'>" + formatAppField(description) + "</span>" +
           "</span></a>";
  return "<li draggable='true' ondragstart='ondragstart_add_favorite(event)' ondragend='ondragend_(event)'>" + a + "</li>";
}

// in our Agimus, we simplify the fnames, we must handle this
function simplifyFname(k) {
    k = k.replace(/^C([A-Z][a-z])/, "$1").replace(/-(etu|ens|gest|pers|teacher|default)$/, '');
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

var displayedServices;

function mayUpdateDisplayedServices(force) {
    var wanted = location_hash() === '*' ? 0 : 4 * 2;
    if (force || wanted !== displayedServices) {
        document.querySelector('.show-all').classList.toggle('hide', !wanted);
        document.querySelector('.show-less').classList.toggle('hide', wanted);
        displayServices(wanted);
        displayedServices = wanted;
    }
}
function displaySuggestions() {
    mayUpdateDisplayedServices(true);
}


function displayServices(nb) {
  var orderedAppIds = (latestTopApps ? normalizeAppIds(latestTopApps) : []).concat(Object.keys(pE.validApps));

  var done = {};
  if (nb) {
    favorites.forEach(function (appId) { done[appId] = true });
  }
  function matchingApps(wantedTabTitle) {
    var l = [];
    orderedAppIds.forEach(function (appId) {
      var app = pE.validApps[appId];
      if (app && !done[appId] &&
          app.tags[0] !== "__hidden__" && 
          (!wantedTabTitle || app.tags[0] === wantedTabTitle)) {
              done[appId] = true;
              l.push(app);
          }
    });
    return l;
  }

  function sortByString(l, f) {
      return l.sort(function compare( a, b ) {
          var a_ = f(a);
          var b_ = f(b);
          return a_ < b_ ? -1 : a_ > b_ ? 1 : 0;
      });
  }

  function computeServicesBlock(l) {
    var links = l.map(computeLink);
    links.push("<li class='padding'></li><li class='padding'></li><li class='padding'>");
    return "<ul>" + links.join('') + "</ul>";
 }
    var html = '';
    if (nb === 0) {
        var tabBlock = function(tagFilter, tabTitle) {
            html += "<h3>" + tabTitle + "</h3>";
            var apps = sortByString(matchingApps(tagFilter), function (app) { 
                return app.text || app.title;
            });
            html += computeServicesBlock(apps);
        }
        tabTitles.forEach(function (tagTitle) { tabBlock(tagTitle, tagTitle) });
        tabBlock(undefined, 'Divers');
    } else {
        html = computeServicesBlock(matchingApps(undefined).slice(0, nb));
    }
    h.simpleQuerySelector(".liste-service").innerHTML = html;   
}

window.onLoadTopApps = function (DATA) {
  if (DATA && DATA.topApps) {
    latestTopApps = DATA.topApps;
    sessionStorageSet("latestTopApps:" + pE.DATA.user, latestTopApps, tomorrow());
  }
  if (inProgress) {
    inProgress = false;
    displaySuggestions();
  }
};

var loadBandeauJs = function(params) {
   inProgress = true;
   if (pE.wanted_uid)
       params.push("uid=" + encodeURIComponent(pE.wanted_uid));    
   params.push("callback=window.onLoadTopApps");
   h.loadScript((pE_args.layout_url || pE.CONF.layout_url) + (params.length ? "?" + params.join('&') : ''));
   setTimeout(function () {
    window.onLoadTopApps();
   }, 1000);

};

function withInfo() {
  // remove splash screen
  document.getElementById("loading").className = "hidden";
    
  h.simpleQuerySelector('#pE-header .pE-title-ent').hidden = true;
  h.simpleQuerySelector('#pE-header .pE-title-separator').innerHTML = '';
  h.simpleQuerySelector('#pE-header .pE-title-app-long').innerHTML = 'Environnement numérique de travail (ENT)';
  h.simpleQuerySelector('#pE-header .pE-title-app-short').innerHTML = 'ENT';

  [ ".liste-favorites", ".liste-service", ".search-services" ].forEach(function (selector) {
    h.simpleQuerySelector(selector).onmousedown = function (event) {
      var elt = h.eltClosest(event.target, "a[data-fname]");
      var fname = elt && elt.getAttribute('data-fname');
      if (fname) {
          var index = 1 + eltIndex(h.eltClosest(elt, "li"));
          var log = { user: pE.DATA.user, app: fname, index: index };
          if (selector.match(/favorites/)) log.favorite = 'click';
          else if (selector.match(/search/)) log.search = rawSearch;
          server_log(log);
      }
    };
  });
  h.simpleQuerySelector(".search-persons").onmousedown = function (event) {
    server_log({ user: pE.DATA.user, person: true, search: rawSearch });
  };

  displayFavorites();
  
  latestTopApps = sessionStorageGet("latestTopApps:" + pE.DATA.user);
  if (latestTopApps) {
      displaySuggestions();
  } else {
      loadBandeauJs(['latestTopApps']);
  }
}

function handleTabTitles() {
    tabTitles = [];
    pE.DATA.layout.folders.forEach(function (tab) {
        tab.portlets.forEach(function (app) {
            if (!app.tags) app.tags = [];
            if (tab.title !== '') app.tags.unshift(tab.title);
        });
        if (!tab.title.match(/^(__hidden__|)$/)) // (Accueil|Intranet|Assistance|Administrateurs|__hidden__|)
            tabTitles.push(tab.title);
    });    
}

function handle_data_href_from_fname() {
    h.simpleEach(h.simpleQuerySelectorAll('a[data-href-from-fname]'), function (elt) {
        var app = pE.validApps[elt.getAttribute('data-href-from-fname')];
        if (app) elt.href = app.url;
    });
}

pE_args.onload = function (pE_) {
  pE = pE_;
  h = pE.helpers;
  favorites = pE.DATA.favorites || pE.DATA.topApps.filter(function (id) { return pE.validApps[id] }).slice(0, 5);
  handleTabTitles();
  handle_data_href_from_fname();

  withInfo();
    
  h.onReady(function () {
      var div = document.getElementById("pE-footer-inner-app")
      setClassIfNonBottom(div, "alwaysVisible");
  });

};
