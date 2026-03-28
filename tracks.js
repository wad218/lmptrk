(function () {
    'use strict';

    var omdbApiKey = '7d0a0115';
    var omdbCache = {};

    function getRating(title, season, episode, callback) {
        var cacheKey = title + '_' + season + '_' + episode;
        if (omdbCache[cacheKey]) return callback(omdbCache[cacheKey]);

        var url = 'https://www.omdbapi.com/?apikey=' + omdbApiKey + '&t=' + encodeURIComponent(title) + '&Season=' + season + '&Episode=' + episode;
        
        $.getJSON(url, function(data) {
            var rating = data && data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : false;
            omdbCache[cacheKey] = rating;
            callback(rating);
        });
    }

    function init() {
        // Слухаємо подію рендеру списку торрента
        Lampa.Listener.follow('torrent_file', function (e) {
            if (e.type == 'render' && e.items) {
                
                // Отримуємо чисту назву серіалу
                var card = Lampa.Activity.active().card;
                var title = card ? (card.title || card.name) : '';
                if(!title) title = $('.torrent-edit__title').text();
                if(title) title = title.split(/[(\[sS\d{1,2}[eE]/)[0].trim();

                if (!title) return;

                // Проходимо по кожному елементу списку (серії)
                e.items.forEach(function (item, index) {
                    if (item.season && item.episode) {
                        getRating(title, item.season, item.episode, function(rating) {
                            if (rating) {
                                // Знаходимо потрібний рядок у списку за індексом
                                var entry = $('.torrent-file').eq(index);
                                if (entry.length && !entry.find('.imdb-list-rating').length) {
                                    // Додаємо рейтинг перед розміром файлу
                                    var html = $('<span class="imdb-list-rating" style="color: #f5c518; margin-left: 10px; font-weight: bold; font-size: 0.8em;">★ ' + rating + '</span>');
                                    entry.find('.torrent-file__title').append(html);
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    // Офіційна реєстрація плагіна в Lampa
    var manifest = {
        type: "other",
        version: "1.0.0",
        name: "IMDb Torrent Ratings",
        description: "Показує рейтинг кожної серії прямо у списку торрента",
        component: "imdb_list"
    };

    function start() {
        window.imdb_list_ready = true;
        Lampa.Manifest.plugins = manifest;
        init();
    }

    if (!window.imdb_list_ready) {
        if (window.appready) start();
        else {
            Lampa.Listener.follow("app", function (e) {
                if (e.type === "ready") start();
            });
        }
    }
})();
