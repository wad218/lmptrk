(function () {
    'use strict';

    var apiBase = 'https://api.shotstack.io/v1/probe/';
    var omdbApiKey = '7d0a0115'; // Ваш робочий ключ
    var cache = {};
    var cacheTtlMs = 1000 * 60 * 10;
    var listOpened = false;
    var listProbeRequested = false;

    function cacheGet(key) {
        var item = cache[key];
        if (!item) return null;
        if (Date.now() - item.ts > cacheTtlMs) {
            delete cache[key];
            return null;
        }
        return item.data;
    }

    function cacheSet(key, data) {
        cache[key] = { ts: Date.now(), data: data };
    }

    // Функція для отримання рейтингу
    function getOmdbRating(imdbId, title, season, episode, callback) {
        var query = imdbId ? 'i=' + imdbId : 't=' + encodeURIComponent(title);
        var url = 'https://www.omdbapi.com/?apikey=' + omdbApiKey + '&' + query + '&Season=' + season + '&Episode=' + episode;
        
        $.getJSON(url, function(data) {
            if (data && data.imdbRating && data.imdbRating !== 'N/A') {
                callback(data.imdbRating);
            } else {
                callback(null);
            }
        }).fail(function() { callback(null); });
    }

    function reguest(params, callback) {
        var cacheKey = params.url;
        var cached = cacheGet(cacheKey);
        if (cached) return callback(cached);

        var net = new Lampa.Reguest();
        var url = apiBase + encodeURIComponent(params.url);
        net["native"](url, function (str) {
            var json = {};
            try { json = JSON.parse(str); } catch (e) {}
            var meta = json && json.response && json.response.metadata ? json.response.metadata : json;
            if (meta && meta.streams) {
                var result = { streams: meta.streams, format: meta.format || {} };
                cacheSet(cacheKey, result);
                callback(result);
            }
        }, false, false, { dataType: 'text' });
    }

    function parseMetainfo(data) {
        var loading = Lampa.Template.get('tracks_loading');
        data.item.after(loading);

        reguest(data.element, function (result) {
            if (listOpened) {
                var html = Lampa.Template.get('tracks_metainfo', {});
                
                var append = function (name, fields, customLabel) {
                    if (fields.length) {
                        var block = Lampa.Template.get('tracks_metainfo_block', {});
                        block.find('.tracks-metainfo__label').text(customLabel || Lampa.Lang.translate(name == 'video' ? 'extensions_hpu_video' : name == 'audio' ? 'player_tracks' : 'player_' + name));
                        fields.forEach(function (data) {
                            var item = $('<div class="tracks-metainfo__item selector"></div>');
                            for (var i in data) {
                                var div = $('<div class="tracks-metainfo__column--' + i + '"></div>');
                                div.text(data[i]);
                                item.append(div);
                            }
                            block.find('.tracks-metainfo__info').append(item);
                        });
                        html.append(block);
                    }
                };

                var video = [], audio = [], subs = [], imdbData = [];

                // Відео потоки
                result.streams.filter(function(a){return a.codec_type == 'video'}).slice(0, 1).forEach(function (v) {
                    var line = {};
                    if (v.width && v.height) line.video = v.width + 'x' + v.height;
                    if (v.codec_name) line.codec = v.codec_name.toUpperCase();
                    if (v.avg_frame_rate && v.avg_frame_rate !== "0/0") {
                        var fps = v.avg_frame_rate.split('/');
                        line.fps = (Number(fps[0]) / Number(fps[1])).toFixed(3) + ' FPS';
                    }
                    video.push(line);
                });

                // Аудіо потоки
                result.streams.filter(function(a){return a.codec_type == 'audio'}).forEach(function (a, i) {
                    var line = { num: i + 1 };
                    if (a.tags) line.lang = (a.tags.language || '').toUpperCase();
                    line.name = a.tags ? a.tags.title || a.tags.handler_name : '';
                    if (a.codec_name) line.codec = a.codec_name.toUpperCase();
                    audio.push(line);
                });

                // Отримуємо рейтинг IMDb
                var card = Lampa.Activity.active().card || {};
                var season = data.element.season;
                var episode = data.element.episode;

                if (season && episode) {
                    getOmdbRating(card.imdb_id, card.title || card.name, season, episode, function(rating) {
                        if (rating) {
                            imdbData.push({ val: '★ ' + rating, info: 'Season ' + season + ', Episode ' + episode });
                            append('imdb', imdbData, 'Рейтинг IMDb');
                        }
                        
                        // Додаємо решту інфи
                        append('video', video);
                        append('audio', audio);
                        
                        loading.remove();
                        data.item.after(html);
                        if (Lampa.Controller.enabled().name == 'modal') Lampa.Controller.toggle('modal');
                    });
                } else {
                    append('video', video);
                    append('audio', audio);
                    loading.remove();
                    data.item.after(html);
                }
            }
        });
    }

    function initTracks() {
        Lampa.Listener.follow('torrent_file', function (data) {
            if (data.type == 'list_open') listOpened = true;
            if (data.type == 'list_close') listOpened = false;
            if (data.type == 'render' && listOpened) {
                if (data.items.length == 1 || (data.items.length > 1 && data.items[data.items.length - 1] === data.element && !listProbeRequested)) {
                    listProbeRequested = true;
                    parseMetainfo(data);
                }
            }
        });
    }

    function addTemplates() {
        Lampa.Template.add('tracks_loading', '<div class="tracks-loading"><span>#{loading}...</span></div>');
        Lampa.Template.add('tracks_metainfo', '<div class="tracks-metainfo"></div>');
        Lampa.Template.add('tracks_metainfo_block', '<div class="tracks-metainfo__line"><div class="tracks-metainfo__label"></div><div class="tracks-metainfo__info"></div></div>');
        var css = '<style>.tracks-metainfo__item--imdb{color:#f5c518;font-weight:bold;font-size:1.2em}.tracks-metainfo__column--val{margin-right:15px}</style>';
        $('body').append(css);
    }

    function startPlugin() {
        window.plugin_tracks_ready = true;
        addTemplates();
        initTracks();
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow("app", function (e) { if (e.type === "ready") startPlugin(); });
})();
