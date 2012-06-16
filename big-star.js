(function() {
  var bindEvents, filter, override, replaceButton, replaceCommentButton, replaceStar, throttle, user_icon;
  user_icon = function(name) {
    return "http://www.st-hatena.com/users/" + (encodeURI(name.slice(0, 2))) + "/" + (encodeURI(name)) + "/profile_l.gif";
  };
  throttle = function(fn, delay) {
    var timer;
    timer = null;
    return function() {
      var args, context;
      if (timer) {
        return;
      }
      context = this;
      args = arguments;
      return timer = setTimeout(function() {
        timer = null;
        return fn.apply(context, args);
      }, delay || 50);
    };
  };
  replaceStar = function($star) {
    var $container, $star_image, $star_src, $user_image;
    if ($star.prop('data-hatena-big-star-init')) {
      return;
    }
    $star.prop('data-hatena-big-star-init', true);
    $container = $('<span>');
    $container.addClass('hatena-big-star-star-container');
    $user_image = $star.find('img');
    $star_src = $user_image.attr('src');
    $user_image.addClass('hatena-big-star-user');
    $user_image.attr({
      src: user_icon($star[0].href.match(/hatena\.ne\.jp\/([^\/]+)\/?/)[1])
    });
    $star_image = $('<img>');
    $star_image.addClass('hatena-big-star-star');
    $star_image.attr({
      src: $star_src
    });
    $container.append($user_image).append($star_image);
    return $star.append($container);
  };
  replaceButton = function($container) {
    if ($container.prop('data-hatena-big-star-init')) {
      return;
    }
    return $container.prop('data-hatena-big-star-init', true);
  };
  replaceCommentButton = function($button) {
    if ($button.prop('data-hatena-big-star-comment-init')) {
      return;
    }
    return $button.prop('data-hatena-big-star-comment-init', true);
  };
  filter = throttle(function() {
    $('span.hatena-star-star-container a').each(function() {
      try {
        return replaceStar($(this));
      } catch (error) {
        if (console) {
          return console.log(error);
        }
      }
    });
    $('.hatena-star-star-container').each(function() {
      return replaceButton($(this));
    });
    return $('.hatena-star-comment-button').each(function() {
      return replaceCommentButton($(this));
    });
  });
  filter();
  override = function() {
    var k, style, v;
    style = {
      '-webkit-transform': 'scale(2.0)',
      '-webkit-transform-origin': '0% 0%',
      '-moz-transform': 'scale(2.0)',
      '-moz-transform-origin': '0% 0%',
      '-o-transform': 'scale(2.0)',
      '-o-transform-origin': '0% 0%',
      'background': 'white',
      'margin-top': '22px',
      'margin-left': '2px'
    };
    for (k in style) {
      v = style[k];
      Hatena.Star.Pallet.PALLET_STYLE += "" + k + ": " + v + "; ";
    }
    Hatena.Star.NameScreen.prototype._baseStyle = {
      color: '#000',
      position: 'absolute',
      display: 'none',
      zIndex: 10002,
      left: 0,
      top: 0,
      backgroundColor: '#fff',
      border: '1px solid #bbb'
    };
    return delete Ten.SubWindow._baseStyle.backgroundColor;
  };
  bindEvents = function() {
    $(document.body).bind('DOMNodeInserted', function() {
      return filter();
    });
    return $(document.body).bind('mouseup', function() {
      return filter();
    });
  };
  bindEvents();
  return override();
})();