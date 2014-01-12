###

* はてなブログの記事の日付に六曜を表示する

** 使い方

以下をコピーして デザイン編集 → カスタマイズ → フッタHTML に貼り付け

<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="https://rawgithub.com/hitode909/hatenablog-unofficial-modules/master/rokuyo.js"></script>

旧暦を取得するWeb APIを利用しています．
- http://api.sekido.info/qreki?output=usage

日付が途中で改行して崩れる場合はいかのようなCSSを指定すれば直るかもしれない

.date {
  display: inline-block;
  width: auto;
}

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
      $rokuyou.addClass "rokuyou-#{ rokuyou }"
      $rokuyou.text rokuyou
      $article.find('.date a').append $rokuyou

  main = ->
    ($ 'article').each ->
      handle_article ($ this)

  do main
  setInterval ->
    do main
  , 1000
