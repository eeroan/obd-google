google.load("jquery", "1");

var prependingEvent;
var pageSize = 8;
var currentStart = 0;
var waitingForNext = false;
var throttle = 30;
var scrollDistance = 100;
google.setOnLoadCallback(function () {
  initSearchField();
  initRadioBehavior();
  $("#more").click(function () {
    alert("lol");
    doNext();
    return false;
  });
});

function url() {
  return "http://ajax.googleapis.com/ajax/services/search/" + searchMode().url;
}

function searchMode() {
  var SEARCH_MODES = {
    textMode   : {
      name    : 'Text search',
      url     : 'web?callback=?',
      isImages: false,
      callBack: webCallBack
    },
    imageMode  : {
      name    : 'Image search',
      url     : 'images?callback=?',
      isImages: true,
      callBack: imagesCallBack
    },
    youtubeMode: {
      name    : 'YouTube search',
      url     : 'video?callback=?',
      isImages: true,
      callBack: youtubeCallback
    }
  };
  return SEARCH_MODES[$('#modesContainer input[name=mode]:checked').val()];
}

function initSearchField() {
  $("form").submit(doSearch);
}

function initRadioBehavior() {
  $("#modesContainer input").change(function () {
    $("#searchField").focus();
    setResultClass();
    doSearch();
    return false;
  });
  setResultClass();
  function setResultClass() {
    $('#results').toggleClass('images', searchMode().isImages);
  }
}

function doSearch() {
  $("#icon").show();
  currentStart = 0;
  $.getJSON(url(), restParams(0), function (data) {
    $("#results").empty().scrollTop(0);
    callBack(data);
    $("#icon").hide();
    doNext();
    doNext();
    doNext();
    doNext();
    doNext();
  });
  return false;
}

function doNext() {
  waitingForNext = true;
  currentStart += pageSize;
  $.getJSON(url(), restParams(currentStart), function (data) {
    callBack(data);
    waitingForNext = false;
  });
  return false;
}

function hasResults(data) {
  return results(data) && results(data).length > 0;
}

function results(data) {
  return data.responseData.results;
}

function callBack(data) {
  searchMode().callBack(data);
}

function webCallBack(data) {
  var target = $("#results");
  $(results(data)).each(function () {
    var resultData = this;
    var title = $("<h2>").append(a().append(resultData.title));
    var content = $("<p>").append(a().append(resultData.content));
    var url = a().append(resultData.visibleUrl);
    var result = $("<div>").addClass("result").append(title).append(content).append(url);
    target.append(result);
    function a() {
      return $("<a>").attr("href", resultData.url).attr("target", "_blank");
    }
  });
}

function imagesCallBack(data) {
  var target = $("#results");
  $(results(data)).each(function () {
    var resultData = this;
    var title = $("<h2>").append(a().append(resultData.title));
    var content = a().append($("<img>").attr("src", resultData.tbUrl).attr('title', resultData.titleNoFormatting));
    var result = $("<div>").addClass("result").append(title).append(content);
    target.append(result);
    function a() {
      return $("<a>").attr("href", resultData.url).attr("target", "_blank");
    }
  });
}

function youtubeCallback(data) {
  var target = $("#results");
  $(results(data)).each(function () {
    var resultData = this;
    var title = $("<h2>").append(a().append(resultData.title));
    var content = a().append($("<img>").attr("src", resultData.tbUrl).attr('title', resultData.titleNoFormatting));
    var result = $("<div>").addClass("result").append(title).append(content);
    target.append(result);
    function a() {
      return $("<a>").attr("href", resultData.playUrl);
    }
  });
}

function doClick(resultData, elem) {
  setTargetPage(resultData.playUrl || resultData.url);
  highlightSelected(elem);
}

function restParams(start) {
  return {
    v    : "1.0",
    q    : query(),
    num  : pageSize,
    rsz  : 'large',
    safe : 'off',
    start: start
  };
}

function query() {
  return $.trim($("#searchField").val()).replace(/\+/gi, "%2B").replace(/ /gi, "+");
}

function highlightSelected(newItem) {
  $("#results .selected").removeClass("selected");
  newItem.addClass("selected");
}

function setTargetPage(url) {
  document.location = url;
}

function isAtEnd() {
  var res = $("#results");
  return res.get(0).scrollHeight - (res.scrollTop() + res.height()) < scrollDistance;
}

function scrollTo(middleItem) {
  var container = $("#results");
  var selected = middleItem.get(0);
  container.scrollTop(selected.offsetTop - (container.height() - selected.offsetHeight) / 2);
}

function initJqueryPlugins() {
  $.fn.exists = function () {
    return this && this.length > 0;
  };
}
