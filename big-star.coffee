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
      , delay || 100

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
      src: $star_src
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
      replaceStar $(this)

    $('.hatena-star-star-container').each ->
      replaceButton $(this)

    $('.hatena-star-comment-button').each ->
      replaceCommentButton $(this)

  filter()

  bindEvents = ->
    $(document.body).bind 'DOMNodeInserted', ->
      filter()

    $(document.body).bind 'mouseup', ->
      filter()

  bindEvents()

  override()