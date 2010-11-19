//google.load("jquery", "1");

var keyUpEvent;
var firstResultSelectEvent;
var firstResultDelay = 1500;
var resultClickDelay = 500;
var pageSize = 8;
var currentStart = 0;
var waitingForNext = false;
var throttle = 30;
var scrollDistance = 100;

//google.setOnLoadCallback(init);

init();
function init() {
  initJqueryPlugins();
  initSearchField();
  initShortcuts();
  keyUpAction();
  initScrollBehavior();
  initToggleBehavior();
  initRadioBehavior();
  initUrlParams();
}

function url() { return "http://ajax.googleapis.com/ajax/services/search/" + searchMode().url; }

function searchMode() {
  var SEARCH_MODES = {
    textMode: {
      name:'Text search',
      url:'web?callback=?',
      isImages:false,
      callBack:webCallBack
    },
    imageMode: {
      name:'Image search',
      url:'images?callback=?',
      isImages:true,
      callBack:imagesCallBack
    },
    youtubeMode: {
      name:'YouTube search',
      url:'video?callback=?',
      isImages:true,
      callBack:youtubeCallback
    }
  };
  return SEARCH_MODES[$('#modesContainer input[name=mode]:checked').val()];
}

function initSearchField() {
  $("#searchField").val("").focus().keyup(function() {
    clearTimeout(keyUpEvent);
    keyUpEvent = setTimeout(keyUpAction, throttle);
  });
}

function initShortcuts() {
  $("#searchField").keyup(function(e) {
    var selected = $("#results .selected");
    switch (e.keyCode) {
      case 38:
        moveTo(selected.prev());
        break;
      case 40:
        moveTo(selected.next());
        break;
    }

    function moveTo(elem) {
      if (elem.exists()) {
        elem.click();
        scrollTo(elem);
      }
    }
  });
}

function keyUpAction() { fieldChange($("#searchField"), doSearch); }

function initScrollBehavior() {
  $("#results").scroll(function() {
    if (isAtEnd() && !waitingForNext) {
      doNext();
    }
  });
}

function initToggleBehavior() {
  $("#hide").click(function() { toggleSidebar(false); });
  $("#show").click(function() {
    toggleSidebar(true);
    $("#searchField").focus();
  });
}

function initRadioBehavior() {
  $("#modesContainer input").change(function() {
    $("#modesContainer .selected").removeClass('selected');
    $(this).next().addClass('selected');
    $("#searchField").focus();
    setResultClass();
    doSearch();
  });
  setResultClass();
  function setResultClass() { $('#results').toggleClass('images', searchMode().isImages); }
}

function initUrlParams() {
  var topHref = parent.document.location.href;
  //var searchHref = document.location.href;
  var query = URLDecode($.getURLParam('q', topHref));
  var mode = URLDecode($.getURLParam('mode', topHref));
  if (query) {
    $("#searchField").val(query);
    if (mode) {
      $("#" + mode).click();
    }
    doSearch();
  }
}

function toggleSidebar(isVisible) {
  $("#large").toggle(isVisible);
  $("#tiny").toggle(!isVisible);
  var sidebarWidth = isVisible ? 330 : 45;
  $(parent.document.body).attr("cols", sidebarWidth + ",*");
}

function fieldChange(field, onchange) {
  var lastVal = field.data("lastValue");
  var currentVal = $.trim(field.val());
  if (!lastVal || lastVal != currentVal) {
    field.data("lastValue", currentVal);
    onchange(currentVal);
  }
}

function doSearch() {
  $("#icon").show();
  currentStart = 0;
  $.getJSON(url(), restParams(0), function(data) {
    $("#results").empty().scrollTop(0);
    callBack(data);
    if (hasResults(data)) {
      doClick(results(data)[0], $("#results .result:first"), firstResultDelay);
    } else {
      doClick({url:"empty.html",titleNoFormatting:"Google OBD"}, $("#searchField"), firstResultDelay);
    }
    $("#icon").hide();
    doNext();
  });
}

function doNext() {
  waitingForNext = true;
  currentStart += pageSize;
  $.getJSON(url(), restParams(currentStart), function(data) {
    callBack(data);
    waitingForNext = false;
  });
}

function hasResults(data) { return results(data) && results(data).length > 0; }
function results(data) { return data.responseData.results; }
function callBack(data) { searchMode().callBack(data); }

function webCallBack(data) {
  var target = $("#results");
  $(results(data)).each(function() {
    var resultData = this;
    var title = $("<h2>").append(a().append(resultData.title));
    var content = $("<p>").append(a().append(resultData.content));
    var url = a().append(resultData.visibleUrl);
    var result = $("<div>").addClass("result").append(title).append(content).append(url);
    result.click(function() {
      $("#searchField").focus();
      doClick(resultData, $(this));
      return false;
    });
    target.append(result);
    function a() { return $("<a>").attr("href", resultData.url); }
  });
}

function imagesCallBack(data) {
  var target = $("#results");
  $(results(data)).each(function() {
    var resultData = this;
    var title = $("<h2>").append(a().append(resultData.title));
    var content = a().append($("<img>").attr("src", resultData.tbUrl).attr('title', resultData.titleNoFormatting));
    var result = $("<div>").addClass("result").append(title).append(content);
    result.click(function() {
      $("#searchField").focus();
      doClick(resultData, $(this));
      return false;
    });
    target.append(result);
    function a() { return $("<a>").attr("href", resultData.url); }
  });
}

function youtubeCallback(data) {
  var target = $("#results");
  $(results(data)).each(function() {
    var resultData = this;
    var title = $("<h2>").append(a().append(resultData.title));
    var content = a().append($("<img>").attr("src", resultData.tbUrl).attr('title', resultData.titleNoFormatting));
    var result = $("<div>").addClass("result").append(title).append(content);
    result.click(function() {
      $("#searchField").focus();
      doClick(resultData, $(this));
      return false;
    });
    target.append(result);
    function a() { return $("<a>").attr("href", resultData.playUrl); }
  });
}

function doClick(resultData, elem, delay) {
  highlightSelected(elem);
  parent.document.title = resultData.titleNoFormatting;
  clearTimeout(firstResultSelectEvent);
  firstResultSelectEvent = setTimeout(function() {
    setTargetPage(resultData.playUrl || resultData.url);
  }, delay || resultClickDelay);
}

function restParams(start) {
  return {
    v:"1.0",
    q:query(),
    num:pageSize,
    rsz:'large',
    safe:'off',
    start:start
  };
}

function query() { return $.trim($("#searchField").val()).replace(/\+/gi, "%2B").replace(/ /gi, "+"); }

function highlightSelected(newItem) {
  $("#results .selected").removeClass("selected");
  newItem.addClass("selected");
}

function setTargetPage(url) {
  $("#newWindow").attr("href", url);
  $(parent.document).find("#resultFrame").attr("src", url);
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
  $.fn.exists = function() { return this && this.length > 0; };
  $.extend({
    getURLParam: function(strParamName, strHref) {
      var strReturn = "";
      var bFound = false;

      var cmpstring = strParamName + "=";
      var cmplen = cmpstring.length;

      if (strHref.indexOf("?") > -1) {
        var strQueryString = strHref.substr(strHref.indexOf("?") + 1);
        var aQueryString = strQueryString.split("&");
        for (var iParam = 0; iParam < aQueryString.length; iParam++) {
          if (aQueryString[iParam].substr(0, cmplen) == cmpstring) {
            var aParam = aQueryString[iParam].split("=");
            strReturn = aParam[1];
            bFound = true;
            break;
          }
        }
      }
      if (!bFound) {
        return null;
      }
      return strReturn;
    }
  });
}

function URLDecode(psEncodeString) {
  if (!psEncodeString) {
    return null;
  }
  var lsRegExp = /\+/g;
  return unescape(String(psEncodeString).replace(lsRegExp, " "));
}