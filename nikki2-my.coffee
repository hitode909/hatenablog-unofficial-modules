later = (func) ->
  setTimeout func, 0

executeByQueue = do ->
  queue = []
  timer = null
  (func) ->
    if timer
      queue.push func
      return
    else
      timer = setInterval ->
        if queue.length > 0
          queue.shift()()
        else
          clearInterval(timer)
          timer = null
      , 1000

      func()

keyWithPrefix = (key) ->
  "blog-viewer-#{key}"

extractPath = (url) ->
  url.replace "#{location.protocol}//#{location.host}", ""

roundEpoch = (epoch) ->
  date = new Date(epoch * 1000)
  Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000)

throttle = (fn, delay) ->
  timer = null
  ->
    return if timer
    context = this
    args = arguments
    timer = setTimeout ->
      timer = null
      fn.apply context, args
    ,delay || 100

debounce = `function (func, threshold, execAsap) {
    var timeout;
    return function debounced () {
        var obj = this, args = arguments;
        function delayed () {
            if (!execAsap)
                func.apply(obj, args);
            timeout = null;
        };
        if (timeout)
            clearTimeout(timeout);
        else if (execAsap)
            func.apply(obj, args);
        timeout = setTimeout(delayed, threshold || 100);
    };
}`

# 画面のより下の途中に入るとおかしくなるのでは
checkScroll = (job) ->

  entry = $('#main-inner article:last')

  unless entry.length > 0
    job()
    return

  top_before = entry.position().top
  job()
  top_after = entry.position().top
  # console.log "scroll #{top_after - top_before}"
  window.scrollBy(0, top_after - top_before)

updateStars = debounce ->
  Hatena.Locale.updateTimestamps(document.body)
  $(document.body).find('span.hatena-star-comment-container, span.hatena-star-star-container').remove()
  Hatena.Star.EntryLoader.loadNewEntries(document.body)
,1000

scrollToEntry = debounce (entry) ->
  return unless entry
  top = $(entry).position().top - $('#blog-title-inner').height() - 20
  if Math.abs($(window).scrollTop() - top) < $(window).height() * 0.4
    window.scrollTo(0, top)
  else
    $('html,body').animate({ scrollTop: top }, 300)

autoloader = throttle ->
  if $(window).scrollTop() <= 0
    entry = $('#main-inner article:first')
    return unless entry.length
    created = new Date(entry.find('time').attr('datetime'))
    showEntries(created.getTime() / 1000)
    window.scrollTo(0, 1)

  if $(window).scrollTop() + $(window).height() >= $(document).height()
    entry = $('#main-inner article:last')
    return unless entry.length
    created = new Date(entry.find('time').attr('datetime'))
    showEntries(created.getTime() / 1000 + 3600*24*3)
,500

entryFromTime = (time) ->
  date = new Date(time)

  found = null
  found_created = 0
  $('#main-inner article').each ->
    entry = $(this)
    entry_created = new Date(entry.find('time').attr('datetime'))
    if Math.abs(entry_created - date) < Math.abs(found_created - date)
      found = entry
      found_created = entry_created

  found

entryFromScrollTop = ->
  top = $(document).scrollTop()
  window_height = $(window).height()
  found = null
  distance = $(document).height()
  $('#main-inner article').each ->
    entry = $(this)
    entry_top = entry.position().top
    entry_height = entry.height()
    if Math.abs(top - entry_top) < distance
      found = entry
      distance = Math.abs(top - entry_top)

  found


formatDate = (date) ->
  return "" if isNaN(date.getFullYear())
  "#{date.getFullYear()}-#{date.getMonth()+1}-#{date.getDate()}"

# todo: image load fail
waitForLoadImages = (element, callback) ->
  images = $(element).find('img')
  if images.length == 0
    callback(element)
    return

  count = 0
  images.each ->
    image = $(this)
    image.load ->
      # console.log("image loaded #{image[0].width} x #{image[0].height}")
      count++
      if count == images.length
        callback(element)

scrollByLocation = ->
  pathname = location.pathname

  # if pathname == "/"
  #   scrollToEntry($('article:first'))
  #   return

  link = $(".entry-footer-time a[href=\"#{pathname}\"]")
  return unless link.length

  scrollToEntry(link.parents('article'))

appendEntry = (entry) ->
  entry = $(entry)
  uuid = entry.attr('data-uuid')
  entry_created = new Date(entry.find('time').attr('datetime'))

  title = entry.find('h1.entry-title')
  if title.text() == '■'
    title.css
      display: 'none'

  entry_old = null
  entry_old_created = null
  entry_recent = null
  entry_recent_created = null

  $('#main-inner article').each ->
    tmp_entry = $(this)
    tmp_created = new Date(tmp_entry.find('time').attr('datetime'))

    if tmp_created <= entry_created && (!entry_old || entry_old_created < tmp_created)
      entry_old = tmp_entry
      entry_old_created = tmp_created


    if tmp_created >= entry_created && (!entry_recent || entry_recent_created > tmp_created)
      entry_recent = tmp_entry
      entry_recent_created = tmp_created

  if entry_old && entry_old.attr('data-uuid') == uuid
    entry.remove()
    return
  if entry_recent && entry_recent.attr('data-uuid') == uuid
    entry.remove()
    return

  later ->
    updateStars()

  checkScroll ->

    if entry_old
      entry_old.after(entry)
      return

    if entry_recent
      entry_recent.before(entry)
      return

    $('#main-inner').prepend(entry)

fetchedHash = {}
showEntries = (epoch) ->
  return unless epoch
  return if epoch < 0
  return if isNaN(epoch)        #???
  deferred = $.Deferred()
  epoch = roundEpoch(epoch)
  url = "/?page=#{epoch}"

  if fetchedHash[url]
    later ->
      deferred.resolve()
    return deferred.promise()

  fetchedHash[url] = true

  executeByQueue ->
    $.ajax
      url: url
      dataType: 'html'
    .success (page) ->
      fragment = document.createDocumentFragment()
      $(page).find('article').each ->
        entry = $(this)
        uuid = entry.attr('data-uuid')

        return if $("article[data-uuid=\"#{uuid}\"]").length > 0

        return if entry.is('.no-entry')

        if entry.find('img').length > 0
          $('#loading-entry').append(entry)
          waitForLoadImages this, (entry) ->
            appendEntry(entry)
        else
          appendEntry(entry)

      deferred.resolve()

  deferred.promise()

fetchYear = (year, res) ->

  res ||=
    entries: []
    completed: false

  deferred = $.Deferred()

  $.ajax
    url: '/archive'
    data:
      year: year
    dataType: 'html'
  .success (page) ->
    date = null
    $(page).find('h1, a.entry-title').each ->
      elem = this
      try
        if elem.tagName.toLowerCase() == 'h1'
          [_, year, month, day] = $(elem).text().match /(\d{4})-(\d{2})-(\d{2})/
          date =
            year: +year
            month: +month
            day: +day
        else if elem.tagName.toLowerCase() == 'a'
          res.entries.unshift
            url: elem.href
            title: $(elem).text()
            date: date

    res.completed = $(page).find('a.entry-title').length == 0

    deferred.resolve(res)

  deferred.promise()

collectCalendar = ->
  deferred = $.Deferred()

  year = new Date().getFullYear()

  fetchYear(year).then (calendar)->
    if calendar.completed
      deferred.resolve(calendar)
      return

    year--
    fetchYear(year, calendar).then arguments.callee

  deferred.promise()

main = ->
  if Hatena && Hatena.Star
    Hatena.Star.SiteConfig =
      entryNodes:
        'div.entry-inner':
          uri: 'a.bookmark'
          title: 'h1.entry-title'
          container: 'p.entry-footer-section'

  $('<div>').attr
    id: 'loading-entry'
  .css
    display: 'none'
  .appendTo($('body'))


  articles = []
  $('article').each ->
    entry = this
    articles.push($(entry).clone())
    $(entry).remove()

  $.each articles, ->
    appendEntry(this)

  # setTimeout ->
  #   scrollByLocation()
  # ,100

  module_dummy = $('<div>').addClass('hatena-module').addClass('hatena-module-profile')

  $('.hatena-follow-button-box').appendTo(module_dummy)
  module_dummy.appendTo($('#blog-title-inner'))


  $('body').delegate '.entry-footer-time a, h1.entry-title a', 'click', (event) ->
    return true unless history && history.pushState
    path = extractPath(this.href)
    history.pushState(path, path, path)
    later ->
      scrollByLocation()
    false

  $('body').delegate 'article .date', 'click', (event) ->
    $(this).parents('article').find('.entry-footer-time a').click()
    false

  $('body').delegate '#blog-title a', 'click', (event) ->
    return true unless history && history.pushState
    path = extractPath(this.href)
    history.pushState(path, path, path)
    later ->
      scrollByLocation()
    false

  $(window).bind 'popstate', (event) ->
    scrollByLocation()

  setTimeout ->
    updateStars()
  ,1000

  $(window).bind 'scroll', ->
    autoloader()




main()
window.scrollBy(0,1)
$('.pager').remove()
