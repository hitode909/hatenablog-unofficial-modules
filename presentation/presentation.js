if (typeof Hatena === 'undefined') {
    var Hatena = {};
}

if (typeof Hatena.Blog === 'undefined') {
    Hatena.Blog = {};
}

Hatena.Blog.Presentation = {
    slides:[],
    currentIndex:0,
    init: function () {
        $('.entry-date').append('<a href="#presentation">プレゼンテーション</a>');
    },
    supported: function () {
        return ! ('ontouchstart' in window);
    },
    start: function () {
        if (this.started) return;
        this.started = true;

        // h3レベルの見出しを見つけてスライドにする(markdownモードだとh1とか使えるからうまくいかなそう)
        $('article div.section > h3').parent().each(function () {
            Hatena.Blog.Presentation.slides.push($(this));
        });

        var self = this;
        $(window).keyup(function (e) {
            if (e.keyCode === 27) {
                // esc
                self.exit();
            }
            else if (e.keyCode === 74) {
                // j
                Hatena.Blog.Presentation.next();
            }
            else if (e.keyCode === 39) {
                // right arrow
                Hatena.Blog.Presentation.next();
            }
            else if (e.keyCode === 75) {
                // k
                Hatena.Blog.Presentation.prev();
            }
            else if (e.keyCode === 37) {
                // left arrow
                Hatena.Blog.Presentation.prev();
            }
            else if (e.keyCode === 70) {
                // lf
                Hatena.Blog.Presentation.fullScreen();
            }
        });

        $(function () {
            setInterval(function () {
                var date = new Date();
                $("#presentation-time").text(date.toLocaleTimeString());
            }, 1000);
        });

        // 初期スタイル
        $('body').children().each(function() {
            $(this).css('display','none');
        });

        $('a').each(function() {
            $(this).attr('target', '_blank');
        });

        var $container = $('<div id="presentation-container"></div>');
        $container.append('<link rel="stylesheet" type="text/css" href="https://hitode909.github.io/hatenablog-unofficial-modules/presentation/presentation.css"/>');
        $container.append('<div class="presentation-pager"><span id="presentation-time"></span> - <span class="current-page">0</span>/<span class="max-page">0</span><progress max="100" value="0" class="presentation-progress"></div>');
        $container.append('<div class="presentation-title">' + document.title + '</div>');
        $container.append('<div class="presentation-content entry-content"></div>');

        $(document.body).prepend($container);

        this.showSlide();
    },
    fullScreen: function () {
        var $container = $('#presentation-container');
        var container = $container[0];

        var f = container.requestFullscreen || container.webkitRequestFullScreen || container.mozRequestFullScreen || container.msRequestFullscreen;
        if (!f) return;
        f.apply(container);
    },
    next: function () {
        if (this.currentIndex < this.slides.length)  {
            this.currentIndex++;
            this.showSlide();
        }
    },
    prev: function () {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showSlide();
        }
    },
    selectSlide: function (number) {
        this.currentIndex = +number;
        this.showSlide();
    },
    showSlide: function () {
        var slide = this.slides[this.currentIndex];
        slide.css('display', 'block');
        $('.presentation-content').empty().append(slide);
        $('.current-page').text(this.currentIndex + 1);
        $('.max-page').text(this.slides.length);
        if (this.slides.length > 0) {
            $('.presentation-progress').val(Math.floor(((this.currentIndex + 1) / this.slides.length)*100));
        }
        $('body').scrollTop(0);
        $('#presentation-container').scrollTop(0);
        location.hash = 'presentation-' + this.currentIndex;
    },
    exit: function() {
        location.hash = '';
        location.reload();
    },
    notifyHash: function(hash) {
        if (this.hash === hash) return;
        this.hash = hash;

        if (hash.match(/^#presentation/)) {
            this.start();
        }
        var slideNumber = hash.match(/^#presentation-(.+)$/);
        if (!slideNumber) return;
        this.selectSlide(slideNumber[1]);
    },
    dummy:'dummy'
};

$(document).ready(function () {
    if (!Hatena.Blog.Presentation.supported()) return;
    Hatena.Blog.Presentation.init();
    Hatena.Blog.Presentation.notifyHash(location.hash);
});

window.onhashchange = function () {
    if (!Hatena.Blog.Presentation.supported()) return;
    Hatena.Blog.Presentation.notifyHash(location.hash);
};
