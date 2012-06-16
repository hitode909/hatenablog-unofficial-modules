do ->

  user_icon = (name) ->
    "http://www.st-hatena.com/users/#{encodeURI(name.slice(0, 2))}/#{encodeURI(name)}/profile_l.gif"

  throttle = (fn, delay) ->
    timer = null
    ->
      return if timer
      context = this
      args = arguments
      timer = setTimeout ->
        timer = null
        fn.apply context, args
      , delay || 50

  replaceStar = ($star) ->
    return if $star.prop 'data-hatena-big-star-init'
    $star.prop 'data-hatena-big-star-init', true

    $container = $ '<span>'
    $container.addClass 'hatena-big-star-star-container'

    # mouseoverを再利用するために改造して使う……
    $user_image = $star.find 'img'
    $star_src = $user_image.attr('src')

    $user_image.addClass 'hatena-big-star-user'

    $user_image.attr
      src: user_icon $star[0].href.match(/hatena\.ne\.jp\/([^\/]+)\/?/)[1]

    $star_image = $('<img>')
    $star_image.addClass 'hatena-big-star-star'
    $star_image.attr
      src: $star_src

    $container
      .append($user_image)
      .append($star_image)

    $star.append $container

  replaceButton = ($container) ->
    return if $container.prop 'data-hatena-big-star-init'
    $container.prop 'data-hatena-big-star-init', true

  replaceCommentButton = ($button) ->
    return if $button.prop 'data-hatena-big-star-comment-init'
    $button.prop 'data-hatena-big-star-comment-init', true

  filter = throttle ->
    $('span.hatena-star-star-container a').each ->
      try
        replaceStar $(this)
      catch error
        console.log(error) if console

    $('.hatena-star-star-container').each ->
      replaceButton $(this)

    $('.hatena-star-comment-button').each ->
      replaceCommentButton $(this)

  filter()

  override = ->
    style =
      '-webkit-transform': 'scale(2.0)'
      '-webkit-transform-origin': '0% 0%'
      '-moz-transform': 'scale(2.0)'
      '-moz-transform-origin': '0% 0%'
      '-o-transform': 'scale(2.0)'
      '-o-transform-origin': '0% 0%'
      'background': 'white'
      'margin-top': '22px'
      'margin-left': '2px'

    for k, v of style
      Hatena.Star.Pallet.PALLET_STYLE += "#{k}: #{v}; "

    Hatena.Star.NameScreen.prototype._baseStyle =
        color: '#000'
        position: 'absolute'
        display: 'none'
        zIndex: 10002
        left: 0
        top: 0
        backgroundColor: '#fff'
        border: '1px solid #bbb'

    delete Ten.SubWindow._baseStyle.backgroundColor

  bindEvents = ->
    $(document.body).bind 'DOMNodeInserted', ->
      filter()

    $(document.body).bind 'mouseup', ->
      filter()

  bindEvents()

  override()