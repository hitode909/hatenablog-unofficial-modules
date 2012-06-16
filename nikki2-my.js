var appendEntry, autoloader, checkScroll, collectCalendar, debounce, entryFromScrollTop, entryFromTime, executeByQueue, extractPath, fetchYear, fetchedHash, formatDate, keyWithPrefix, later, main, roundEpoch, scrollByLocation, scrollToEntry, showEntries, throttle, updateStars, waitForLoadImages;
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
checkScroll = function(job) {
  var entry, top_after, top_before;
  entry = $('#main-inner article:last');
  if (!(entry.length > 0)) {
    job();
    return;
  }
  top_before = entry.position().top;
  job();
  top_after = entry.position().top;
  return window.scrollBy(0, top_after - top_before);
};
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
  link = $(".entry-footer-time a[href=\"" + pathname + "\"]");
  if (!link.length) {
    return;
  }
  return scrollToEntry(link.parents('article'));
};
appendEntry = function(entry) {
  var entry_created, entry_old, entry_old_created, entry_recent, entry_recent_created, title, uuid;
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
  later(function() {
    return updateStars();
  });
  return checkScroll(function() {
    if (entry_old) {
      entry_old.after(entry);
      return;
    }
    if (entry_recent) {
      entry_recent.before(entry);
      return;
    }
    return $('#main-inner').prepend(entry);
  });
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
  var articles, module_dummy;
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
  module_dummy = $('<div>').addClass('hatena-module').addClass('hatena-module-profile');
  $('.hatena-follow-button-box').appendTo(module_dummy);
  module_dummy.appendTo($('#blog-title-inner'));
  $('body').delegate('.entry-footer-time a, h1.entry-title a', 'click', function(event) {
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
  setTimeout(function() {
    return updateStars();
  }, 1000);
  return $(window).bind('scroll', function() {
    return autoloader();
  });
};
main();
window.scrollBy(0, 1);
$('.pager').remove();