var appendBar, appendBarAtTime, appendEntry, autoloader, checkScroll, collectCalendar, debounce, entryFromScrollTop, entryFromTime, executeByQueue, extractPath, fetchYear, fetchedHash, formatDate, keyWithPrefix, later, main, roundEpoch, scrollByLocation, scrollToEntry, selectEntryByUUID, setTip, showEntries, throttle, updateScrollBar, updateStars, waitForLoadImages, _tipTimer;
later = function(func) {
  return setTimeout(func, 0);
};
executeByQueue = (function() {
  var queue, timer;
  queue = [];
  timer = null;
  return function(func) {
    if (timer) {
      queue.push(func);
    } else {
      timer = setInterval(function() {
        if (queue.length > 0) {
          return queue.shift()();
        } else {
          clearInterval(timer);
          return timer = null;
        }
      }, 1000);
      return func();
    }
  };
})();
keyWithPrefix = function(key) {
  return "blog-viewer-" + key;
};
extractPath = function(url) {
  return url.replace("" + location.protocol + "//" + location.host, "");
};
roundEpoch = function(epoch) {
  var date;
  date = new Date(epoch * 1000);
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000);
};
appendBar = function(x, css) {
  var bar;
  bar = $('<div>').attr({
    "class": 'calendar-bar'
  }).css({
    left: x
  });
  if (css) {
    bar.css(css);
  }
  bar.appendTo('#calendar');
  return bar;
};
appendBarAtTime = function(created, css) {
  var date_from, date_now;
  date_from = new Date(2011, 11 - 1, 7);
  date_now = new Date();
  return appendBar("" + ((created - date_from) / (date_now - date_from) * 100) + "%", css);
};
selectEntryByUUID = function(uuid) {
  var left;
  $(".calendar-bar.selected").removeClass("selected");
  $(".calendar-bar[data-uuid=\"" + uuid + "\"]").addClass('selected');
  if (!$(".calendar-bar.selected").length) {
    return;
  }
  left = $(".calendar-bar.selected").position().left - $("#scroll-bar").width() / 2;
  if (left < 3) {
    left = 3;
  }
  if (left > 550 - 13) {
    left = 550 - 13;
  }
  return $("#scroll-bar").css({
    left: left
  });
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
debounce = function (func, threshold, execAsap) {
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
};
checkScroll = debounce(function() {
  var entry, top_before;
  entry = $('#main-inner article:last');
  if (!entry.length) {
    return;
  }
  top_before = entry.position().top;
  return later(function() {
    var top_after;
    top_after = entry.position().top;
    return window.scrollBy(0, top_after - top_before);
  });
}, 100, true);
updateStars = debounce(function() {
  Hatena.Locale.updateTimestamps(document.body);
  $(document.body).find('span.hatena-star-comment-container, span.hatena-star-star-container').remove();
  return Hatena.Star.EntryLoader.loadNewEntries(document.body);
}, 1000);
scrollToEntry = debounce(function(entry) {
  var top;
  if (!entry) {
    return;
  }
  top = $(entry).position().top - $('#blog-title-inner').height() - 20;
  if (Math.abs($(window).scrollTop() - top) < $(window).height() * 0.4) {
    return window.scrollTo(0, top);
  } else {
    return $('html,body').animate({
      scrollTop: top
    }, 300);
  }
});
updateScrollBar = function() {
  var created, entry;
  entry = entryFromScrollTop();
  if (!entry) {
    return;
  }
  selectEntryByUUID(entry.attr('data-uuid'));
  created = new Date(entry.find('time').attr('datetime'));
  setTip(formatDate(created));
  return autoloader();
};
autoloader = throttle(function() {
  var created, entry;
  if ($(window).scrollTop() <= 0) {
    entry = $('#main-inner article:first');
    if (!entry.length) {
      return;
    }
    created = new Date(entry.find('time').attr('datetime'));
    showEntries(created.getTime() / 1000);
    window.scrollTo(0, 1);
  }
  if ($(window).scrollTop() + $(window).height() >= $(document).height()) {
    entry = $('#main-inner article:last');
    if (!entry.length) {
      return;
    }
    created = new Date(entry.find('time').attr('datetime'));
    return showEntries(created.getTime() / 1000 + 3600 * 24 * 3);
  }
}, 500);
_tipTimer = null;
setTip = function(text) {
  var tip;
  tip = $('#calendar-container #tip');
  if (tip.text() === text) {
    return;
  }
  tip.text(text).stop().css({
    opacity: 1
  });
  if (_tipTimer) {
    clearTimeout(_tipTimer);
  }
  return _tipTimer = setTimeout(function() {
    return tip.animate({
      opacity: 0
    }, 1500);
  }, 10000);
};
entryFromTime = function(time) {
  var date, found, found_created;
  date = new Date(time);
  found = null;
  found_created = 0;
  $('#main-inner article').each(function() {
    var entry, entry_created;
    entry = $(this);
    entry_created = new Date(entry.find('time').attr('datetime'));
    if (Math.abs(entry_created - date) < Math.abs(found_created - date)) {
      found = entry;
      return found_created = entry_created;
    }
  });
  return found;
};
entryFromScrollTop = function() {
  var distance, found, top, window_height;
  top = $(document).scrollTop();
  window_height = $(window).height();
  found = null;
  distance = $(document).height();
  $('#main-inner article').each(function() {
    var entry, entry_height, entry_top;
    entry = $(this);
    entry_top = entry.position().top;
    entry_height = entry.height();
    if (Math.abs(top - entry_top) < distance) {
      found = entry;
      return distance = Math.abs(top - entry_top);
    }
  });
  return found;
};
formatDate = function(date) {
  if (isNaN(date.getFullYear())) {
    return "";
  }
  return "" + (date.getFullYear()) + "-" + (date.getMonth() + 1) + "-" + (date.getDate());
};
waitForLoadImages = function(element, callback) {
  var count, images;
  images = $(element).find('img');
  if (images.length === 0) {
    callback(element);
    return;
  }
  count = 0;
  return images.each(function() {
    var image;
    image = $(this);
    return image.load(function() {
      count++;
      if (count === images.length) {
        return callback(element);
      }
    });
  });
};
scrollByLocation = function() {
  var link, pathname;
  pathname = location.pathname;
  if (pathname === "/") {
    scrollToEntry($('article:first'));
    return;
  }
  link = $(".entry-footer-time a[href=\"" + pathname + "\"]");
  if (!link.length) {
    return;
  }
  return scrollToEntry(link.parents('article'));
};
appendEntry = function(entry) {
  var bar, entry_created, entry_old, entry_old_created, entry_recent, entry_recent_created, title, uuid;
  entry = $(entry);
  uuid = entry.attr('data-uuid');
  entry_created = new Date(entry.find('time').attr('datetime'));
  title = entry.find('h1.entry-title');
  if (title.text() === '■') {
    title.css({
      display: 'none'
    });
  }
  entry_old = null;
  entry_old_created = null;
  entry_recent = null;
  entry_recent_created = null;
  $('#main-inner article').each(function() {
    var tmp_created, tmp_entry;
    tmp_entry = $(this);
    tmp_created = new Date(tmp_entry.find('time').attr('datetime'));
    if (tmp_created <= entry_created && (!entry_old || entry_old_created < tmp_created)) {
      entry_old = tmp_entry;
      entry_old_created = tmp_created;
    }
    if (tmp_created >= entry_created && (!entry_recent || entry_recent_created > tmp_created)) {
      entry_recent = tmp_entry;
      return entry_recent_created = tmp_created;
    }
  });
  if (entry_old && entry_old.attr('data-uuid') === uuid) {
    entry.remove();
    return;
  }
  if (entry_recent && entry_recent.attr('data-uuid') === uuid) {
    entry.remove();
    return;
  }
  bar = appendBarAtTime(entry_created);
  bar.attr({
    'data-uuid': uuid
  });
  later(function() {
    return updateStars();
  });
  checkScroll();
  later(function() {
    return updateScrollBar();
  });
  if (entry_old) {
    entry_old.after(entry);
    return;
  }
  if (entry_recent) {
    entry_recent.before(entry);
    return;
  }
  return $('#main-inner').prepend(entry);
};
fetchedHash = {};
showEntries = function(epoch) {
  var deferred, url;
  if (!epoch) {
    return;
  }
  if (epoch < 0) {
    return;
  }
  if (isNaN(epoch)) {
    return;
  }
  deferred = $.Deferred();
  epoch = roundEpoch(epoch);
  url = "/?page=" + epoch;
  if (fetchedHash[url]) {
    later(function() {
      return deferred.resolve();
    });
    return deferred.promise();
  }
  fetchedHash[url] = true;
  executeByQueue(function() {
    return $.ajax({
      url: url,
      dataType: 'html'
    }).success(function(page) {
      var fragment;
      fragment = document.createDocumentFragment();
      $(page).find('article').each(function() {
        var entry, uuid;
        entry = $(this);
        uuid = entry.attr('data-uuid');
        if ($("article[data-uuid=\"" + uuid + "\"]").length > 0) {
          return;
        }
        if (entry.is('.no-entry')) {
          return;
        }
        if (entry.find('img').length > 0) {
          $('#loading-entry').append(entry);
          return waitForLoadImages(this, function(entry) {
            return appendEntry(entry);
          });
        } else {
          return appendEntry(entry);
        }
      });
      return deferred.resolve();
    });
  });
  return deferred.promise();
};
fetchYear = function(year, res) {
  var deferred;
  res || (res = {
    entries: [],
    completed: false
  });
  deferred = $.Deferred();
  $.ajax({
    url: '/archive',
    data: {
      year: year
    },
    dataType: 'html'
  }).success(function(page) {
    var date;
    date = null;
    $(page).find('h1, a.entry-title').each(function() {
      var day, elem, month, _, _ref;
      elem = this;
      try {
        if (elem.tagName.toLowerCase() === 'h1') {
          _ref = $(elem).text().match(/(\d{4})-(\d{2})-(\d{2})/), _ = _ref[0], year = _ref[1], month = _ref[2], day = _ref[3];
          return date = {
            year: +year,
            month: +month,
            day: +day
          };
        } else if (elem.tagName.toLowerCase() === 'a') {
          return res.entries.unshift({
            url: elem.href,
            title: $(elem).text(),
            date: date
          });
        }
      } catch (_e) {}
    });
    res.completed = $(page).find('a.entry-title').length === 0;
    return deferred.resolve(res);
  });
  return deferred.promise();
};
collectCalendar = function() {
  var deferred, year;
  deferred = $.Deferred();
  year = new Date().getFullYear();
  fetchYear(year).then(function(calendar) {
    if (calendar.completed) {
      deferred.resolve(calendar);
      return;
    }
    year--;
    return fetchYear(year, calendar).then(arguments.callee);
  });
  return deferred.promise();
};
main = function() {
  var articles, calendar, container, module_dummy, scrollBar, tip;
  if (Hatena && Hatena.Star) {
    Hatena.Star.SiteConfig = {
      entryNodes: {
        'div.entry-inner': {
          uri: 'a.bookmark',
          title: 'h1.entry-title',
          container: 'p.entry-footer-section'
        }
      }
    };
  }
  $('<div>').attr({
    id: 'loading-entry'
  }).css({
    display: 'none'
  }).appendTo($('body'));
  container = $('<div>').attr({
    id: 'calendar-container'
  }).css({
    display: 'none'
  });
  calendar = $('<div>').attr({
    id: 'calendar'
  });
  container.append(calendar);
  tip = $('<div>').attr({
    id: 'tip'
  });
  container.append(tip);
  $('#container').append(container);
  calendar.click(function(event) {
    var date_from, date_now, entry, path, time_selected, width, x;
    width = container.width();
    x = event.clientX - container.position().left;
    date_from = new Date(2011, 11 - 1, 7);
    date_now = new Date();
    time_selected = date_from.getTime() + (date_now.getTime() - date_from.getTime()) * (x / width);
    entry = entryFromTime(time_selected);
    path = extractPath(entry.find('.entry-footer-time a').attr('href'));
    history.pushState(path, path, path);
    return scrollToEntry(entry);
  });
  calendar.mousemove(throttle(function(event) {
    var date_from, date_now, date_selected, date_selected_3days_up, time_selected, time_selected_3days_up, width, x;
    width = container.width();
    x = event.clientX - container.position().left;
    date_from = new Date(2011, 11 - 1, 7);
    date_now = new Date();
    time_selected = date_from.getTime() + (date_now.getTime() - date_from.getTime()) * (x / width);
    time_selected_3days_up = date_from.getTime() + (date_now.getTime() - date_from.getTime()) * (x / width) + 3600 * 24 * 1000 * 3;
    date_selected = new Date(time_selected);
    date_selected_3days_up = new Date(time_selected_3days_up);
    setTip(formatDate(date_selected));
    return showEntries(Math.floor(date_selected_3days_up.getTime() / 1000));
  }));
  scrollBar = $('<div>').attr({
    id: 'scroll-bar'
  });
  calendar.append(scrollBar);
  $(window).bind('scroll', throttle(function(event) {
    return updateScrollBar();
  }));
  articles = [];
  $('article').each(function() {
    var entry;
    entry = this;
    articles.push($(entry).clone());
    return $(entry).remove();
  });
  $.each(articles, function() {
    return appendEntry(this);
  });
  setTimeout(function() {
    return scrollByLocation();
  }, 100);
  module_dummy = $('<div>').addClass('hatena-module').addClass('hatena-module-profile');
  $('.hatena-follow-button-box').appendTo(module_dummy);
  module_dummy.appendTo($('#blog-title-inner'));
  $('body').delegate('.entry-footer-time a', 'click', function(event) {
    var path;
    if (!(history && history.pushState)) {
      return true;
    }
    path = extractPath(this.href);
    history.pushState(path, path, path);
    later(function() {
      return scrollByLocation();
    });
    return false;
  });
  $('body').delegate('article .date', 'click', function(event) {
    $(this).parents('article').find('.entry-footer-time a').click();
    return false;
  });
  $('body').delegate('#blog-title a', 'click', function(event) {
    var path;
    if (!(history && history.pushState)) {
      return true;
    }
    path = extractPath(this.href);
    history.pushState(path, path, path);
    later(function() {
      return scrollByLocation();
    });
    return false;
  });
  $(window).bind('popstate', function(event) {
    return scrollByLocation();
  });
  return setTimeout(function() {
    return updateStars();
  }, 1000);
};
main();
window.scrollBy(0, 1);
$('.pager').remove();