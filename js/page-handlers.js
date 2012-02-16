var prettyNames = {
  gcontacts : 'Google Contacts'
};

var handlers = {};

$(document).ready(function() {
  $('body')
    .delegate('.filters input', 'click', filterCheckboxClick)
    .delegate('.app-card', 'click', function() {
      loadDiv('AppGallery-Details?app=' + $(this).data('id'));
      return false;
    })
    .delegate('.iframeLink', 'click', function() {
      loadDiv($(this).data('id'));
      return false;
    })
    .delegate('.filter-visibility', 'click', function() {
      var container = '#' + $($(this).closest('section')).attr('id');
      var filters = $('#AppGallery ' + container + ' .filters');

      if (filters.is(':visible')) {
        $(this).text('Show Filters');
        filters.hide();
      } else {
        $(this).text('Hide Filters');
        filters.show();
      }

      return false;
    });

  // Supports lazy loading of app cards
  $(window).scroll(function(e) {
    if(getRowsBelowFold() - getAppCardRows() < 0 && getCurrentSection() === 'Featured') getFeaturedPage();
  });
});

function filterCheckboxClick(element) {
  var container = '#' + $($(element.currentTarget).closest('section')).attr('id');

  var checked = $('#AppGallery ' + container + ' .filters input:checked');

  if (checked.length === 0) {
    loadDiv('AppGallery-Featured');
  } else {
    var app = "AppGallery-Filter?";
    var types = [];
    var services = [];

    $('#AppGallery ' + container + ' .types input:checked').each(function(i, elem) {
      types.push($(elem).attr('name'));
    });

    $('#AppGallery ' + container + ' .services input:checked').each(function(i, elem) {
      services.push($(elem).attr('name'));
    });

    var params = [];

    if(types.length > 0)
      params.push("types=" + types.join(','));
    if(services.length > 0)
      params.push("services=" + services.join(','));

    loadDiv(app + params.join('&'));
  }
}

function loadDiv(app) {
  var info = splitApp(app);
  app = info.app;

  // Check that the hash already exists before we load the app
  // to avoid loading it twice
  if (window.location.hash.substring(1).indexOf(app) !== 0) {
    window.location.hash = app;

    return;
  }

  $('.app-container').hide();
  $('.app-container#appDiv').show();
  $('.iframeLink,.your-apps,header div.nav a').removeClass('blue');
  $(".selected-section").removeClass('selected-section');
  $('.iframeLink[data-id="' + info.app + '"]').addClass('blue');
  $('header div a[data-id="' + info.topSection + '"]').addClass('blue');
  $(".sidenav #" + info.topSection).addClass('selected-section');
  $("#appDiv #" + info.topSection).addClass('selected-section');
  $("#appDiv #" + info.topSection + " #" + info.subSection).addClass('selected-section');
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
  $('#AppGallery #Featured').html('');

  showLoading('Featured');

  generateBreadCrumbs({filter: true}, function(breadcrumbHTML) {
    clearLoading('Featured');

    $('#AppGallery #Featured').append(breadcrumbHTML);

    generateAppFilters(function(filterHTML) {
      $('#AppGallery #Featured').append(filterHTML);

      getFeaturedPage();
    });
  });
};

var gettingPage = false;
function getFeaturedPage(showsLoading) {
  if(gettingPage) return;
  gettingPage = true;
  registry.getAllApps(getPage(), function(appsObj) {
    var apps = [];

    for(var i in appsObj) apps.push(appsObj[i]);

    generateAppsHtml(apps, function(html) {
      $('#AppGallery #Featured').append(html);

      gettingPage = false;
    });
  });
}

handlers.AppGallery.Author = function(params) {
  showLoading('Author');
  generateBreadCrumbs({author:params.author},function(breadcrumbHTML) {
    getAuthorPage(params, breadcrumbHTML);
  });
};

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

  if(params.types)
    filters.types = params.types.split(',');
  if(params.services)
    filters.services = params.services.split(',');

  registry.getByFilter(filters, function(appsObj) {
    var apps = [];
    var breadcrumbs = [];

    for(var i in appsObj) apps.push(appsObj[i]);
    for(var j in filters.types) breadcrumbs.push({type:filters.types[j], name:prettyName(filters.types[j])});
    for(var k in filters.services) breadcrumbs.push({service:filters.services[k], name:prettyName(filters.services[k])});

    generateBreadCrumbs({filter:true, filters:breadcrumbs}, function(breadcrumbHTML) {
      clearLoading('Filter');

      $('#AppGallery #Filter').html(breadcrumbHTML);

      generateAppFilters(function(filterHTML) {
        $('#AppGallery #Filter').append(filterHTML);

        for(var i in filters.types) {
          $('#AppGallery #Filter input[name=' + filters.types[i] +']').prop('checked', true);
        }

        for(var j in filters.services) {
          $('#AppGallery #Filter input[name=' + filters.services[j] + ']').prop('checked', true);
        }

        generateAppsHtml(apps, function(html) {
          if (!html) {
            $('#AppGallery #Filter').append("<div id='no-results'>No app like that exists... yet. Why don't you <a href='develop#Develop-BuildAnApp' class='orange'>create the first</a>?</div>");
          } else {
            $('#AppGallery #Filter').append(html);
          }
        });
      });
    });
  });
};

handlers.AppGallery.Details = function(params) {
  registry.getApp(params.app, function(app) {
    generateBreadCrumbs({app:app},function(appHTML) {
      $('#AppGallery #Details').html(appHTML);
      generateAppDetailsHtml(app, function(html) {
        $('#AppGallery #Details').append(html);
        doAppHeader(app.name, '#appDiv .app-header');
      });
    });
  });
};

function getAppInfo(appName, callback) {
  registry.getApp(appName, function(app) {
    if(!app) {
      return registry.getMap(function(err, map) {
        if(err) return callback(err);
        if(map[appName]) return callback(undefined, map[appName]);
      });
    }
    //XXX: ugh, map does a bunch of merging so need to "replicate" it here
    for(var i in app.repository) if(!app[i] && app.repository[i]) app[i] = app.repository[i];
    return callback(undefined, app);
  });
}

function getAppAndServices(appName, callback) {
  getAppInfo(appName, function(err, app) {
    // this cannot be caught anywhere so is simply for debugging
    if (err) throw err;
    registry.getConnectedServices(app.uses, function(connected) {
      registry.getUnConnectedServices(app.uses, function(unconnected) {
        return callback({
          app:app,
          connected:connected,
          unconnected:unconnected});
      });
    });
  });
}

function doAppHeader(appName, element) {
  getAppAndServices(appName, function(info) {
    registry.getMyAuthoredApps(function(myAuthoredApps) {
      info.mine = myAuthoredApps[appName];
      if (info.mine) info.app.author = registry.localAuthor;
      dust.render('appHeader', info, function(err, appHtml) {
        $(element).html(appHtml);
        $(element).show();
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

// lazy loading
var loadedCallback = {

};

function getPage() {
  var skip = getDisplayedAppCards();
  var limit = getNextPageSize();
  return {skip:skip, limit:limit};
}

function getCurrentSection() {
  return $('#appDiv #AppGallery .selected-section').attr('id');
}

var appCardSelector = '#appDiv #AppGallery .app-card';
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
  var divWidth = $('#appDiv').width();
  return Math.floor(divWidth/appCardWidth);
}

function getAppCardRows() {
    var appCardHeight = getAppCardHeight();
    var displayHeight = getDisplayHeight();
    return Math.floor(displayHeight/appCardHeight);
}

function getDisplayedAppCards() {
    return $('#appDiv #AppGallery .selected-section .app-card').length;
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
  return $('#appDiv #AppGallery').height();
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
