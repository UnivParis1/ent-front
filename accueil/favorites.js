const favoritesRestdbUrl = 'https://restdb.univ-paris1.fr/favorites/apps';

var onRestdbLogin;
var editMode = false;

function saveFavorites(firstTime) {
    var url = favoritesRestdbUrl + '/$user/list';
    xhr(url, 'PUT', { withCredentials: true }, JSON.stringify({ list: favorites }), function (err, resp) {
        if (err && firstTime) {
            onRestdbLogin = function() { saveFavorites(false) };
            h.loadScript(url, [ 'callback=onRestdbLogin' ]);
            return;
        } else if (err) {
            console.error(err);
            return;
        }
        // tell ProlongationENT not to use "localStorage"s stored in all apps, when it is older than now
        document.cookie = "pE_last_update_time=" + h.now() + "; path=/; domain=univ-paris1.fr; max-age=" + pE.CONF.time_before_checking_browser_cache_is_up_to_date;
        // tell esupUserApps to clear its cache
        raw_xhr(pE.CONF.esupUserApps_url + '/purgeUserCache');

        pE.DATA.favorites = favorites;
        window.prolongation_ENT.redisplay();
    });
}
function addFavorite(appId, dest, target_elt) {
    var to_remove = favorites.indexOf(appId);
    console.log("addFavorite before:", favorites);
    if (dest && dest.trash) {
        console.log("trashing", appId);
        favorites.splice(to_remove, 1);
    } else if (dest) {
        var final_position = dest.position;
        if (to_remove !== -1) {
            if (to_remove < dest.position) final_position -= 1;
            if (to_remove === final_position) {
                console.log("addFavorite: not modified");
                return;
            }
            console.log("addFavorite: removing", appId, "at position", to_remove);
            favorites.splice(to_remove, 1);
        }
        console.log("addFavorite: adding", appId, "at position", final_position);
        favorites.splice(final_position, 0, appId);
    } else if (to_remove === -1) {
        console.log("addFavorite: adding", appId, "at the end");
        favorites.push(appId);
    }
    after_modify_favorites();
}

function add_or_remove_favorite(appId, add_or_remove) {
    if (add_or_remove === 'add') {
        addFavorite(appId);
    } else {
        var to_remove = favorites.indexOf(appId);
        favorites.splice(to_remove, 1);
        after_modify_favorites();
    }
}

function after_modify_favorites() {
    console.log("addFavorite after:", favorites);
    saveFavorites(true);
    displayFavorites();
    displaySuggestions();
}

function onclick_add_or_remove_favorite(event, add_or_remove) {
    event.preventDefault();

    var elt = h.eltClosest && h.eltClosest(event.target, "[data-fname]");
    var appId = elt && elt.getAttribute('data-fname');
    if (appId) add_or_remove_favorite(appId, add_or_remove);
}

function onclick_addFavorite(event) {
    onclick_add_or_remove_favorite(event, 'add');
}
function onclick_removeFavorite(event) {
    onclick_add_or_remove_favorite(event, 'remove');
}

var drag_drop_src;
var drag_drop_dest;

function set_drag_drop_dest(elt_to_move) {
    var position;

    // first get new position
    if (elt_to_move) {
        position = eltIndex(elt_to_move);
        console.log('set_drag_drop_dest move favorite:', elt_to_move, 'currently at position', position);
    }

    //var placeholder = document.querySelector('.liste-favorites .placeholder');
    //console.log("placeholder", placeholder, drag_drop_dest, elt_to_move === placeholder)
    //if (placeholder) placeholder.classList.toggle('in_use', elt_to_move === placeholder);

    // remove drag_drop_dest <li>
    if (drag_drop_dest && drag_drop_dest.li) removeElement(drag_drop_dest.li);
    drag_drop_dest = null;

    if (elt_to_move && elt_to_move.classList.contains('trash')) {
        drag_drop_dest = { trash: true };
    } else if (elt_to_move) {
        var li = document.createElement('li');
        li.className = 'drag_drop_dest';
        var ul = elt_to_move.parentElement;
        ul.insertBefore(li, ul.children[position]);

        drag_drop_dest = { position: position, li: li, elt_to_move: elt_to_move };
    }
}

function ondragstart_(event) {
    document.body.classList.remove("no-drag-drop");
    
    var appId = event.target.querySelector("[data-fname]").getAttribute('data-fname');
    event.dataTransfer.setData("text", appId);
    var img = event.target.querySelector(".icon").cloneNode(); // can NOT size the img, cf https://stackoverflow.com/questions/26346905/html5-setdragimage-dragicon-width-does-absolutely-nothing
    event.dataTransfer.setDragImage(img, 20, 20);
    
    setTimeout(function () { // must be done async otherwise "dragend" is generated in Chrome
        event.target.classList.add("will-move");
        try { openCloseSearchResults(false) } catch (e) {}
     }, 1);
}

function ondragstart_add_favorite(event) {
    document.body.classList.add("drag-drop-add-favorite");
    ondragstart_(event);
}
function ondragstart_modify_favorite(event) {
    document.body.classList.add("drag-drop-modify-favorite");
    ondragstart_(event);
}

function ondragenter_(event) {
    event.preventDefault();
    console.log('ondragenter', event.target);    
    set_drag_drop_dest(h.eltClosest(event.target, "li"));
}

function ondrop_favorite(event) {
    event.preventDefault();
    console.log('ondrop_favorite', event.target, drag_drop_dest);
    addFavorite(event.dataTransfer.getData('text'), drag_drop_dest, event.target);    
}

var ondragenter_or_leave = dragenter_or_leave_wrapper(function(event) {
    var allowed = event && event.type === 'dragenter';
    console.trace('ondragenter_or_leave')

    var elt = document.querySelector('.liste-favorites > .liste');
    elt.classList.toggle("drop-highlight", allowed);

    if (!allowed) set_drag_drop_dest(null);
});

function ondragend_(event) {
    console.trace('ondragend_', event);
    document.body.classList.add("no-drag-drop");
    document.body.classList.remove("drag-drop-add-favorite");
    document.body.classList.remove("drag-drop-modify-favorite");
    event.target.classList.remove("will-move");
    ondragenter_or_leave(null); // force leave
}

function computeFavoriteLink(app) {
    var url = app.url;
    var description = app.description || app.title;
    var removeFavorite = editMode ? "<div class='remove'><img onclick='onclick_removeFavorite(event)' title='Supprimer des favories' src='images/times-circle.svg' draggable='false'></div>" : '';
    var a = "<a title='" + h.escapeQuotes(description) + "' " + (editMode ? '' : "href='" + url + "'") + " data-fname='" + app.fname + "' draggable='false'>" +
              removeFavorite +
              "<img class='icon' alt='' src='" + iconUrl(app.fname) + "' draggable='false' onerror='onerror_iconUrl(this)'>" +
              "<br><span class='title'>" + (app.shortText || app.text || app.title) + "</span>" +
            "</a>";
    return "<li draggable='true' ondragenter='ondragenter_(event)' ondragstart='ondragstart_modify_favorite(event)' ondragend='ondragend_(event)'>" + a + "</li>";
}

function displayFavorites() {
    var links = favorites.map(function (appId) { return pE.validApps[appId] }).filter(function (app) { return app }).map(computeFavoriteLink)
    var html = "<ul>" + links.join('') + "</ul>";
    h.simpleQuerySelector(".liste-favorites > .liste").innerHTML = html;   
}


function dragenter_or_leave_wrapper(doit) {
    var dragenter = 0;
    return function (event) {
        console.log('dragenter_or_leave_wrapper', event);
        if (!event) {
            dragenter = 0;
            doit(null);
        } else if (event.type === 'dragenter') {
            dragenter++;
            if (dragenter > 0) doit(event);
        } else {
            dragenter--;
            setTimeout(function () {
                if (dragenter === 0) doit(event);
            }, 10);
        }
    };
}

function toggleFavoriteEditMode() {
    editMode = !editMode;
    h.simpleQuerySelector(".liste-favorites").classList.toggle("editMode", editMode);
    displayFavorites();
}