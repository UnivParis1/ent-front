var nbNewsDisplayed = 4;
var public = { 
    json: 'https://www.pantheonsorbonne.fr/export/actualites',
    more_url: 'https://www.pantheonsorbonne.fr/actualites',
    base_url: "https://www.pantheonsorbonne.fr",
}
var intranet = {
    json: 'https://intranet-news.univ-paris1.fr/?cas-test=true',
    more_url: 'https://intranet.pantheonsorbonne.fr/ent/intranet2/toutes-les-actualites',
}

function array_unique(array) {
    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }
    return array.filter(onlyUnique);
}

function formatOneNews(oneNews, i) {
    var html = "<div class='title'>" + oneNews.title + "</div>";
    if (oneNews.field_news_date) html += "<div class='date'>" + new Date(oneNews.field_news_date).toLocaleDateString() + "</div>";
    //html += "<div class='description'>" + (oneNews.field_lead || oneNews.body) + "</div>";
    let maybe_img = i === 0 ? "<span><img src='" + oneNews.img + "'></span>" : "";
    return "<li" + (i === 0 ? " class='a-la-une'" : "") + "><a href='" + oneNews.view_node + "'>" + maybe_img + html + "</a></li>";
    }
    
function displayNews(news, more_news_url) {
    var links = news.slice(0, 4).map(formatOneNews);

    var html = "<div>" + 
                 "<ul>" + array_unique(links).join('') + "</ul>" + 
                 "<h4><a href='" + more_news_url + "'>Toutes les actualités</a></h4>"
                "</div>";
    h.simpleQuerySelector(".liste-news").innerHTML = html;
}

function displayIntranetNews(news) {
    displayNews(news, intranet.more_url)
}

function getPublicNews() {
    xhr(public.json, 'GET', { responseType: 'json' }, null, function(err, news) {
        if (err) { 
            console.error(err); 
        }
        for (const oneNews of news) {
            oneNews.img = public.base_url + oneNews.field_media
        }
        displayNews(news, public.more_url)
    })    
}
function getIntranetNews() {
    h.loadScript(intranet.json + "&callback=displayIntranetNews")
}

function handleNews(pE) {
    if (pE.validApps.intranet) {
        getIntranetNews()
    } else {
        getPublicNews();
    }
}
