(function () {
    'use strict';

    function init() {
        // Використовуємо універсальний слухач рендеру компонентів
        Lampa.Listener.follow('torrent_file', function (e) {
            if (e.type == 'render') {
                setTimeout(function() {
                    // Шукаємо блоки, де зазвичай малюється номер серії або іконка
                    // .torrent-file__index, .torrent-file__icon, .torrent-edit__file-icon
                    var icons = $('.torrent-file__index, .torrent-file__icon, [data-index], .torrent-edit__index');
                    
                    if (icons.length === 0) {
                        // Якщо специфічних іконок не знайшли, пробуємо знайти будь-який лівий блок у рядку
                        icons = $('.torrent-file, .torrent-edit__file').children().first();
                    }

                    icons.each(function () {
                        var icon = $(this);
                        if (!icon.find('.imdb-test-tag').length) {
                            // Створюємо яскраву мітку, яку неможливо не помітити
                            var tag = $('<div class="imdb-test-tag" style="position: absolute; background: #ff0000; color: white; font-size: 10px; padding: 2px 4px; border-radius: 3px; z-index: 10; bottom: -5px; right: -5px; border: 1px solid white; font-weight: bold;">9.9</div>');
                            
                            // Робимо батьківський елемент відносним, щоб мітка не "полетіла"
                            icon.css('position', 'relative');
                            icon.append(tag);
                        }
                    });
                    
                    console.log('Test: Applied tags to ' + icons.length + ' icons');
                }, 1000);
            }
        });
    }

    var manifest = {
        type: "other",
        version: "8.8.8",
        name: "ICON TEST",
        description: "Тест на іконках серій",
        component: "imdb_test_icon"
    };

    function start() {
        Lampa.Manifest.plugins = manifest;
        init();
    }

    if (window.appready) start();
    else Lampa.Listener.follow("app", function (e) { if (e.type === "ready") start(); });
})();
