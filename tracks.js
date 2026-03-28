(function () {
    'use strict';

    var omdbApiKey = '7d0a0115';
    var seasonCache = {};

    function getSeasonRatings(imdbId, title, season, callback) {
        var cacheKey = (imdbId || title) + '_S' + season;
        if (seasonCache[cacheKey]) return callback(seasonCache[cacheKey]);

        var query = imdbId ? 'i=' + imdbId : 't=' + encodeURIComponent(title);
        var url = 'https://www.omdbapi.com/?apikey=' + omdbApiKey + '&' + query + '&Season=' + season;
        
        $.getJSON(url, function(data) {
            var ratings = {};
            if (data && data.Episodes) {
                data.Episodes.forEach(function(ep) {
                    var epNum = parseInt(ep.Episode);
                    if (!isNaN(epNum) && ep.imdbRating && ep.imdbRating !== 'N/A') {
                        ratings[epNum] = ep.imdbRating;
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
                // Даємо Лампі 500мс, щоб вона точно "намалювала" список на екрані
                setTimeout(function() {
                    var card = Lampa.Activity.active().card || {};
                    var imdbId = card.imdb_id || '';
                    var title = card.title || card.name || '';
                    
                    var currentSeason = 0;
                    e.items.some(function(item) {
                        if (item.season) { currentSeason = parseInt(item.season); return true; }
                    });

                    if ((imdbId || title) && currentSeason) {
                        getSeasonRatings(imdbId, title, currentSeason, function(ratings) {
                            // Шукаємо всі елементи файлів у відкритому вікні
                            var fileElements = $('.torrent-file, .torrent-edit__file, .preorder-file');
                            
                            e.items.forEach(function (item, index) {
                                var itemEp = parseInt(item.episode);
                                if (itemEp && ratings[itemEp]) {
                                    var entry = fileElements.eq(index);
                                    if (entry.length && !entry.find('.imdb-pro-rating').length) {
                                        // Вставляємо зірочку в блок назви або безпосередньо в рядок
                                        var target = entry.find('.torrent-file__title, .torrent-edit__file-title').first();
                                        if (target.length === 0) target = entry; // Якщо не знайшли заголовок, кріпимо до всього рядка

                                        var ratingHtml = '<span class="imdb-pro-rating" style="color: #f5c518; margin-left: 10px; font-weight: bold; background: rgba(255,255,255,0.1); padding: 2px 5px; border-radius: 4px; display: inline-block;">★ ' + ratings[itemEp] + '</span>';
                                        target.append(ratingHtml);
                                    }
                                }
                            });
                        });
                    }
                }, 500);
            }
        });
    }

    var manifest = {
        type: "other",
        version: "1.3.0",
        name: "IMDb List Ultimate",
        description: "Рейтинги серій",
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
