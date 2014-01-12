###
 * はてなブログの日付に六曜を表示する
###

$ ->
  handle_article = ($article) ->
    return if $article.prop 'rokuyou-loaded'
    $article.prop 'rokuyou-loaded', true

    year  = + $article.find('.date-year').text()
    month = +$article.find('.date-month').text()
    day   = +$article.find('.date-day').text()

    load = $.ajax
      url: 'http://api.sekido.info/qreki'
      dataType: 'jsonp'
      data:
        year:   year
        month:  month
        day:    day
        output: 'jsonp'

    load.done (res) ->
      rokuyou = res.rokuyou_text

      $rokuyou = $ '<span>'
      $rokuyou.addClass 'rokuyou'
      $rokuyou.text rokuyou
      $article.find('.date a').append $rokuyou

  main = ->
    ($ 'article').each ->
      handle_article ($ this)

  do main
  setInterval ->
    do main
  , 1000
