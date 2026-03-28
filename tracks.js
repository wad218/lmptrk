(function () {
    'use strict';

    var omdbApiKey = '7d0a0115';
    var ratingCache = {};

    function getRating(imdbId, title, season, episode, callback) {
        var cacheKey = (imdbId || title) + '_S' + season + '_E' + episode;
        if (ratingCache[cacheKey]) return callback(ratingCache[cacheKey]);

        var query = imdbId ? 'i=' + imdbId : 't=' + encodeURIComponent(title);
        var url = 'https://www.omdbapi.com/?apikey=' + omdbApiKey + '&' + query + '&Season=' + season + '&Episode=' + episode;
        
        $.getJSON(url, function(data) {
            var r = (data && data.imdbRating && data.imdbRating !== 'N/A') ? data.imdbRating : 'N/A';
            ratingCache[cacheKey] = r;
            callback(r);
        });
    }

    function init() {
        // Слухаємо подію фокусу на елементі списку
        Lampa.Listener.follow('torrent_file', function (e) {
            if (e.type == 'hover' && e.item) {
                var item = e.item;
                var card = Lampa.Activity.active().card || {};
                var imdbId = card.imdb_id || '';
                var title = card.title || card.name || '';
                
                if (item.season && item.episode && (imdbId || title)) {
                    // Очищаємо заголовок (якщо немає ID)
                    if (!imdbId) title = title.split(/[(\[sS\d{1,2}[eE]/)[0].trim();

                    getRating(imdbId, title, item.season, item.episode, function(rating) {
                        // Знаходимо або створюємо панель для рейтингу
                        var container = $('.tracks-metainfo');
                        if (container.length) {
                            var imdbBlock = container.find('.imdb-panel-rating');
                            if (!imdbBlock.length) {
                                imdbBlock = $('<div class="imdb-panel-rating" style="margin-top: 5px; color: #f5c518; font-weight: bold; font-size: 1.2em; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px;"></div>');
                                container.append(imdbBlock);
                            }
                            imdbBlock.html('★ IMDb: ' + rating + ' <span style="font-size: 0.7em; color: #aaa; margin-left: 10px;">(S' + item.season + ' E' + item.episode + ')</span>');
                        }
                    });
                }
            }
        });
    }

    var manifest = {
        type: "other",
        version: "2.0.0",
        name: "IMDb Bottom Panel",
        description: "Рейтинг серії в нижній панелі інформації",
        component: "imdb_panel"
    };

    function start() {
        window.imdb_panel_ready = true;
        Lampa.Manifest.plugins = manifest;
        init();
    }

    if (!window.imdb_panel_ready) {
        if (window.appready) start();
        else Lampa.Listener.follow("app", function (e) { if (e.type === "ready") start(); });
    }
})();
