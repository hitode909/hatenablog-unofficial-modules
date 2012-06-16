(function() {
  var bindEvents, filter, replaceButton, replaceCommentButton, replaceStar, throttle, user_icon;
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
      }, delay || 100);
    };
  };
  replaceStar = function($star) {
    var $container, $star_image, $star_src, $user_image;
    if ($star.prop('data-hatena-big-star-init')) {
      return;
    }
    $star.prop('data-hatena-big-star-init', true);
    $container = $('<span>');
    $container.addClass('hatena-big-star-star');
    $container.css({
      position: 'relative',
      display: 'inline-block',
      width: '32px',
      height: '32px',
      margin: '1px',
      verticalAlign: 'middle',
      borderRadius: '2px',
      overflow: 'hidden'
    });
    $user_image = $star.find('img');
    $star_src = $user_image.attr('src');
    $user_image.css({
      width: '32px',
      height: '32px',
      position: 'absolute',
      top: '0px',
      left: '0px',
      margin: '0px',
      padding: '0px',
      marginBottom: '0px !important',
      zIndex: 100
    });
    $user_image.attr({
      src: user_icon($star[0].href.match(/hatena\.ne\.jp\/([^\/]+)\/?/)[1])
    });
    $star_image = $('<img>');
    $star_image.attr({
      src: $star_src
    });
    $star_image.css({
      position: 'absolute',
      bottom: '0px',
      left: '0px',
      margin: '1px',
      padding: '0px',
      marginBottom: '0px !important',
      zIndex: 110
    });
    $container.append($user_image).append($star_image);
    return $star.append($container);
  };
  replaceButton = function($container) {
    if ($container.prop('data-hatena-big-star-init')) {
      return;
    }
    $container.prop('data-hatena-big-star-init', true);
    $container.css({
      fontSize: '32px'
    });
    return $container.find('.hatena-star-add-button').css({
      width: '32px',
      height: '32px'
    });
  };
  replaceCommentButton = function($button) {
    if ($button.prop('data-hatena-big-star-comment-init')) {
      return;
    }
    $button.prop('data-hatena-big-star-comment-init', true);
    return $button.css({
      width: '44px',
      height: '30px'
    });
  };
  filter = throttle(function() {
    $('span.hatena-star-star-container a').each(function() {
      return replaceStar($(this));
    });
    $('.hatena-star-star-container').each(function() {
      return replaceButton($(this));
    });
    return $('.hatena-star-comment-button').each(function() {
      return replaceCommentButton($(this));
    });
  });
  filter();
  bindEvents = function() {
    $(document.body).bind('DOMNodeInserted', function() {
      return filter();
    });
    return document.body.bind('mouseup', function() {
      return filter();
    });
  };
  bindEvents();
  return override();
})();