var nbNewsDisplayed = 4;
var urls = [ '/ent-actualites' ];

function array_unique(array) {
    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }
    return array.filter(onlyUnique);
}

function formatOneNews(oneNews) {
    var html = "<div class='title'>" + oneNews.title + "</div>";
    if (oneNews.field_news_date) html += "<div class='date'>" + new Date(oneNews.field_news_date).toLocaleDateString() + "</div>";
    html += "<div class='description'>" + (oneNews.field_lead || oneNews.body) + "</div>";
    return "<li><a href='https://www.pantheonsorbonne.fr" + oneNews.view_node + "'>" + html + "</a></li>";
}

var news, newsOffset = 0;

function scrollNews(direction) {
    newsOffset += direction;
    displayNews();
}

function displayNews() {
    function scroll_button(body, direction, allowed) {
        return "<button " + (allowed ? "" : "disabled") + " onclick='scrollNews(" + direction + ")' class='scroll left'>" + body + "</button>";
    }
    
    var links = news.slice(newsOffset, newsOffset + nbNewsDisplayed).map(formatOneNews);

    var html = "<div>" + 
                 scroll_button("❮", -1, newsOffset > 0) + 
                 "<ul>" + array_unique(links).join('') + "</ul>" + 
                 scroll_button("❯", 1, newsOffset + nbNewsDisplayed < news.length) + 
                "</div>";
    h.simpleQuerySelector(".liste-news").innerHTML = html;
}

function getNews(urls) {
    var url = urls.shift();
    xhr(url, 'GET', { responseType: 'json' }, null, function(err, news_) {
        if (err) { 
            console.error(err); 
        }
        news = news.concat(news_ || [])
        if (urls.length && news.length < nbNewsDisplayed) {
            getNews(urls);
        } else if (news.length) {
            displayNews();
        }
    })    
}
news = [];
getNews(urls);
