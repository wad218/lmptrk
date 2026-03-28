(function () {
    'use strict';

    function init() {
        Lampa.Listener.follow('torrent_file', function (e) {
            if (e.type == 'render' && e.items) {
                console.log('TEST: Torrent list detected, items:', e.items.length);

                // Даємо Лампі час на рендер
                setTimeout(function() {
                    // Пробуємо всі можливі класи рядків у списку
                    var fileElements = $('.torrent-file, .torrent-edit__file, .preorder-file');
                    
                    fileElements.each(function (index) {
                        var entry = $(this);
                        
                        // Перевіряємо, чи ми вже не додали тест
                        if (!entry.find('.imdb-test').length) {
                            // Шукаємо заголовок або просто рядок
                            var target = entry.find('.torrent-file__title, .torrent-edit__file-title').first();
                            if (target.length === 0) target = entry;

                            // Вставляємо яскраву червону цифру для тесту
                            var testHtml = '<span class="imdb-test" style="color: #ff0000; margin-left: 15px; font-weight: bold; background: white; padding: 2px 8px; border-radius: 4px; border: 2px solid black;">★ 9.9 TEST</span>';
                            target.append(testHtml);
                        }
                    });
                }, 800);
            }
        });
    }

    var manifest = {
        type: "other",
        version: "7.7.7",
        name: "TEST RATING",
        description: "Яскраво-червоний тест",
        component: "imdb_test"
    };

    function start() {
        Lampa.Manifest.plugins = manifest;
        init();
    }

    if (window.appready) start();
    else Lampa.Listener.follow("app", function (e) { if (e.type === "ready") start(); });
})();
