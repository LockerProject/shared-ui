var prettyNames = {
  gcontacts : 'Google Contacts',
}

var handlers = {};

$(document).ready(function() {
  $('body').delegate('.app-card', 'hover', appCardHover)
  .delegate('.sidenav-items input', 'click', filterCheckboxClick)
  .delegate('.app-card', 'click', function() {
    loadDiv('AppGallery-Details?app=' + $(this).data('id'));
    return false;
  }).delegate('.iframeLink', 'click', function() {
    loadDiv($(this).data('id'));
    return false;
  });
  
  $(window).scroll(function(e) {
    if(getRowsBelowFold() - getAppCardRows() < 0 && getCurrentSection() === 'Featured') getFeaturedPage();
  });
});

function filterCheckboxClick(element) {
  var id = $(element.currentTarget).parent().parent().attr('id');
  var checked = $('#' + id + ' input:checked');
  checked
  if (checked.length == 0) {
    loadDiv('AppGallery-Featured');
  } else {
    var app = "AppGallery-Filter?";
    var types = [];
    var services = [];
    $('#types').find(checked).each(function(i, elem) {
      types.push($(elem).attr('id'));
    });
    $('#services').find(checked).each(function(i, elem) {
      services.push($(elem).attr('id'));
    });
    if(types.length > 0) app += "&types=" + types.join(',');
    if(services.length > 0) app += "&services=" + services.join(',');
    loadDiv(app);
  }
  
}

function loadDiv(app) {
  var info = splitApp(app);
  if(info.topSection === 'AppGallery' && getCurrentSection() === info.subSection) return;
  $('iframe#appFrame').hide();
  $('div#appFrame').show();
  $('.iframeLink,.your-apps,header div.nav a').removeClass('blue');
  $(".selected-section").removeClass('selected-section');
  app = info.app;
  window.location.hash = info.app;
  $('.iframeLink[data-id="' + info.app + '"]').addClass('blue');
  $('header div a[data-id="' + info.topSection + '"]').addClass('blue');
  $(".sidenav #" + info.topSection).addClass('selected-section');
  $("div#appFrame #" + info.topSection).addClass('selected-section');
  $("div#appFrame #" + info.topSection + " #" + info.subSection).addClass('selected-section');
  $('.sidenav-items input').attr('checked', false);
  if(handlers[info.topSection]) {
    if(typeof handlers[info.topSection] === 'function') {
      return handlers[info.topSection](info);
    } else if(typeof handlers[info.topSection][info.subSection] === 'function') {
      return handlers[info.topSection][info.subSection](info.params);
    }
  }
}

function splitApp(app) {
  var appTmp = app;
  
  var params = '';
  var ndx = app.indexOf('?');
  if (ndx != -1) {
    params = app.substring(ndx + 1);
    app = app.substring(0, ndx);
  }
  
  var index = app.indexOf('-');
  var topSection = app;
  var subSection;
  var substring;
  if(index > -1) {
    topSection = app.substring(0, index);
    subSection = app.substring(index + 1);
  } else {
    subSection = defaultSubSections[topSection];
    if (subSection) app += '-' + subSection;
  }
  if(params) {
    app += '?' + params;
    var paramsArr = params.split('&');
    params = {};
    for(var i in paramsArr) {
      var param = paramsArr[i].split('=');
      params[param[0]] = param[1];
    }
  }
  return {app:app, topSection:topSection, subSection:subSection, params:params};
}

handlers.AppGallery = {};
handlers.AppGallery.Featured = function() {
  // if(getCurrentSection() == 'Featured') return;
  $('#AppGallery #Featured').html('');
  showLoading('Featured');
  getFeaturedPage();
}

var gettingPage = false;
function getFeaturedPage(showsLoading) {
  if(gettingPage) return;
  gettingPage = true;
  registry.getAllApps(getPage(), function(appsObj) {
    var apps = [];
    for(var i in appsObj) apps.push(appsObj[i]);
    generateAppsHtml(apps, function(html) {
      clearLoading('Featured');
      $('#AppGallery #Featured').append(html);
      gettingPage = false;
    });
  });
}

handlers.AppGallery.Author = function(params) {
  showLoading('Author');
  generateBreadCrumbs({author:params.author},function(breadcrumbHTML) {
    getAuthorPage(params, breadcrumbHTML);
  })
}

function getAuthorPage(params, breadcrumbHTML) {
  registry.getByAuthor(params.author, function(appsObj) {
    var apps = [];
    for(var i in appsObj) apps.push(appsObj[i]);
    generateAppsHtml(apps, function(html) {
      clearLoading('Author');
      if(breadcrumbHTML) $('#AppGallery #Author').html(breadcrumbHTML);
      $('#AppGallery #Author').append(html);
    });
  });
}

handlers.AppGallery.Filter = function(params) {
  showLoading('Filter');
  var filters = {};
  if(params.types) {
    filters.types = params.types.split(',');
    for(var i in filters.types) $('.sidenav-items input[name=' + filters.types[i] + ']').attr('checked', true);
  } else if(params.services) {
    filters.services = params.services.split(',');
    for(var i in filters.services) $('.sidenav-items input[name=' + filters.services[i] + ']').attr('checked', true);
  }

  registry.getByFilter(filters, function(appsObj) {
    var apps = [];
    for(var i in appsObj) apps.push(appsObj[i]);
    var breadcrumbs = [];
    for(var i in filters.types) breadcrumbs.push({type:filters.types[i], name:prettyName(filters.types[i])});
    for(var i in filters.services) breadcrumbs.push({service:filters.services[i], name:prettyName(filters.services[i])});
    generateBreadCrumbs({filters:breadcrumbs}, function(breadcrumbHTML) {
      generateAppsHtml(apps, function(html) {
        if(!html) {
          clearLoading('Filter');
          $('#AppGallery #Filter').append("<div id='no-results'>No app like that exists...yet. Why don't you <a href='#' class='orange iframeLink' data-id='About-ForDevelopers'>create the first</a>?</div>");
        } else {
          clearLoading('Filter');
          $('#AppGallery #Filter').html(breadcrumbHTML);
          $('#AppGallery #Filter').append(html);
        }
      })
    })
  })
}

handlers.AppGallery.Details = function(params) {
  registry.getApp(params.app, function(app) {
    generateBreadCrumbs({app:app},function(appHTML) {
      $('#AppGallery #Details').html(appHTML);
      generateAppDetailsHtml(app, function(html) {
        $('#AppGallery #Details').append(html);
      });
    });
  });
}

function prettyName(str) {
  return prettyNames[str] || capitalizeFirstLetter(str);
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


function appCardHover(e) {
  if (e.type === 'mouseenter') {
    $(e.currentTarget).find('.screenshot').stop().animate({'top': '100px'});
  } else {
    $(e.currentTarget).find('.screenshot').stop().animate({'top': '0px'});
  }
}


// lazy loading
var loadedCallback = {
  
};

function getPage() {
  var skip = getDisplayedAppCards();
  var limit = getNextPageSize();
  return {skip:skip, limit:limit};
}

function getCurrentSection() {
  return $('div#appFrame #AppGallery .selected-section').attr('id');
}

var appCardSelector = 'div#appFrame #AppGallery .app-card';
function getAppCardHeight() {
  var appCardHeight = $(appCardSelector).outerHeight(true);
  if(!(appCardHeight && appCardHeight > 10)) appCardHeight = 138;
  return appCardHeight;
}

function getAppCardWidth() {
  var appCardWidth = $(appCardSelector).outerWidth(true);
  if(!(appCardWidth && appCardWidth > 20)) appCardWidth = 334;
  return appCardWidth;
}

function getAppCardColumns() {
    var appCardWidth = getAppCardWidth();
    var divWidth = $('div#appFrame').width();
    return Math.floor(divWidth/appCardWidth);
}

function getAppCardRows() {
    var appCardHeight = getAppCardHeight();
    var displayHeight = getDisplayHeight();
    return Math.floor(displayHeight/appCardHeight);
}

function getDisplayedAppCards() {
    return $('div#appFrame #AppGallery .selected-section .app-card').length;
}

function getPageSize() {
    return getAppCardColumns() * (getAppCardRows() + 2);
}

function getNextPageSize() {
    var columns = getAppCardColumns();
    var mod = getDisplayedAppCards() % columns;
    if(mod > 0) mod = columns - mod;
    return mod + getPageSize();
}

function getDisplayHeight() {
  var displayHeight = window.innerHeight - $('header').height();
  if(displayHeight < 1) displayHeight = 0;
  return displayHeight;
}

function getTotalHeight() {
  var totalHeight = window.outerHeight - $('header').height();
  if(totalHeight < 1) totalHeight = 0;
  return totalHeight;
}
function getDivHeight() {
  return $('div#appFrame #AppGallery').height();
}

function getRowsBelowFold() {
  var appCardHeight = getAppCardHeight();
  var pageBottom = window.scrollY + getDisplayHeight();
  var totalRows = Math.floor(getDisplayedAppCards() / getAppCardColumns()) + 1;
  var totalHeight = totalRows * appCardHeight;
  var belowFold = totalHeight - pageBottom;
  return Math.floor(belowFold/appCardHeight);
}


// loading placeholder
function showLoading(section) {
  isLoading[section] = true;
  setTimeout(function() {
    if(isLoading[section]) $('#AppGallery #' + section).html('<img src="common/img/loading.gif">');
  }, 1000);
}

var isLoading = {};
var timeouts = {};
function clearLoading(section) {
  if(isLoading[section]) {
    isLoading[section] = false;
    $('#AppGallery #' + section).html('');
  }
}