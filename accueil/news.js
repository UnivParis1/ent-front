var nbNewsDisplayed = 4;
var url = 'https://drupal-test.univ-paris1.fr/export/actualites/ent';
url = '/ent-actualites';

function formatOneNews(oneNews) {
    var html = "<div class='title'>" + oneNews.title + "</div>";
    if (oneNews.field_date_de_l_evenement) html += "<div class='date'>" + new Date(oneNews.field_date_de_l_evenement).toLocaleDateString() + "</div>";
    html += "<div class='description'>" + (oneNews.field_accroche || oneNews.body) + "</div>";
    return "<li><a href='" + oneNews.view_node + "'>" + html + "</a></li>";
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
                 "<ul>" + links.join('') + "</ul>" + 
                 scroll_button("❯", 1, newsOffset + nbNewsDisplayed < news.length) + 
                "</div>";
    h.simpleQuerySelector(".liste-news").innerHTML = html;
}

xhr(url, 'GET', { responseType: 'json' }, null, function(err, news_) {
    if (err) { console.error(err); return; }
    news = news_;
    displayNews();
})

