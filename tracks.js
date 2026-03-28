(function () {
    'use strict';

    var omdbApiKey = '7d0a0115';
    var seasonCache = {};

    function getSeasonRatings(imdbId, title, season, callback) {
        var cacheKey = (imdbId || title) + '_S' + season;
        if (seasonCache[cacheKey]) return callback(seasonCache[cacheKey]);

        // Пріоритет пошуку за ID, якщо немає - за назвою
        var query = imdbId ? 'i=' + imdbId : 't=' + encodeURIComponent(title);
        var url = 'https://www.omdbapi.com/?apikey=' + omdbApiKey + '&' + query + '&Season=' + season;
        
        $.getJSON(url, function(data) {
            var ratings = {};
            if (data && data.Episodes) {
                data.Episodes.forEach(function(ep) {
                    if (ep.Episode && ep.imdbRating && ep.imdbRating !== 'N/A') {
                        ratings[ep.Episode] = ep.imdbRating;
                    }
                });
            }
            seasonCache[cacheKey] = ratings;
            callback(ratings);
        });
    }

    function init() {
        Lampa.Listener.follow('torrent_file', function (e) {
            if (e.type == 'render' && e.items) {
                
                // 1. Отримуємо дані про серіал з картки Lampa
                var card = Lampa.Activity.active().card || {};
                var imdbId = card.imdb_id || '';
                var title = card.title || card.name || '';
                
                // Очищення назви (якщо немає ID)
                if (!imdbId && title) {
                    title = title.split(/[(\[sS\d{1,2}[eE]/)[0].trim();
                }

                // Визначаємо сезон (беремо з першого елемента списку, де він є)
                var currentSeason = 0;
                e.items.some(function(item) {
                    if (item.season) {
                        currentSeason = item.season;
                        return true;
                    }
                });

                if ((imdbId || title) && currentSeason) {
                    // 2. Завантажуємо весь сезон ОДНИМ запитом
                    getSeasonRatings(imdbId, title, currentSeason, function(ratings) {
                        
                        // 3. Розставляємо зірочки по всьому списку
                        e.items.forEach(function (item, index) {
                            if (item.episode && ratings[item.episode]) {
                                var entry = $('.torrent-file').eq(index);
                                if (entry.length && !entry.find('.imdb-pro-rating').length) {
                                    var ratingHtml = $('<span class="imdb-pro-rating" style="color: #f5c518; margin-left: 12px; font-weight: bold; font-size: 0.9em; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">★ ' + ratings[item.episode] + '</span>');
                                    entry.find('.torrent-file__title').append(ratingHtml);
                                }
                            }
                        });
                    });
                }
            }
        });
    }

    var manifest = {
        type: "other",
        version: "1.1.0",
        name: "IMDb Season Pro",
        description: "Рейтинги серій одним запитом через IMDb ID",
        component: "imdb_pro"
    };

    function start() {
        window.imdb_pro_ready = true;
        Lampa.Manifest.plugins = manifest;
        init();
    }

    if (!window.imdb_pro_ready) {
        if (window.appready) start();
        else Lampa.Listener.follow("app", function (e) { if (e.type === "ready") start(); });
    }
})();
