(function () {
    'use strict';

    var omdbApiKey = '7d0a0115';
    var seasonCache = {};

    function getSeasonData(imdbId, title, season, callback) {
        var cacheKey = (imdbId || title) + '_S' + season;
        if (seasonCache[cacheKey]) return callback(seasonCache[cacheKey]);

        // Пріоритет на ID, як у вашому успішному посиланні
        var query = imdbId ? 'i=' + imdbId : 't=' + encodeURIComponent(title);
        var url = 'https://www.omdbapi.com/?apikey=' + omdbApiKey + '&' + query + '&Season=' + season;
        
        $.getJSON(url, function(data) {
            var ratings = {};
            if (data && data.Episodes) {
                data.Episodes.forEach(function(ep) {
                    var epNum = parseInt(ep.Episode);
                    if (!isNaN(epNum)) {
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
            // Реагуємо на виділення (hover) серії у списку
            if (e.type == 'hover' && e.item) {
                var item = e.item;
                var card = Lampa.Activity.active().card || {};
                var imdbId = card.imdb_id || '';
                var title = card.title || card.name || '';
                
                // Якщо це серіал (є сезон та епізод)
                if (item.season && item.episode && (imdbId || title)) {
                    getSeasonData(imdbId, title, item.season, function(ratings) {
                        var rating = ratings[parseInt(item.episode)] || 'N/A';
                        
                        // Шукаємо блок з тех. інфою (куди писав минулий плагін)
                        var container = $('.tracks-metainfo');
                        if (container.length) {
                            var imdbBlock = container.find('.imdb-live-rating');
                            if (!imdbBlock.length) {
                                imdbBlock = $('<div class="imdb-live-rating" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); color: #f5c518; font-weight: bold; font-size: 1.3em;"></div>');
                                container.append(imdbBlock);
                            }
                            
                            var starColor = rating !== 'N/A' ? '#f5c518' : '#666';
                            imdbBlock.html('<span style="color:' + starColor + '">★ IMDb: ' + rating + '</span> <span style="font-size: 0.6em; color: #aaa; margin-left: 10px; font-weight: normal;">Episode ' + item.episode + '</span>');
                        }
                    });
                }
            }
        });
    }

    var manifest = {
        type: "other",
        version: "2.1.0",
        name: "IMDb Smart Panel",
        description: "Виводить рейтинг серії з масиву сезону",
        component: "imdb_smart"
    };

    function start() {
        window.imdb_smart_ready = true;
        Lampa.Manifest.plugins = manifest;
        init();
    }

    if (!window.imdb_smart_ready) {
        if (window.appready) start();
        else Lampa.Listener.follow("app", function (e) { if (e.type === "ready") start(); });
    }
})();
