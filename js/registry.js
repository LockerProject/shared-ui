var baseUrl = "https://burrow.singly.com/registry/_design";

var registry = {};
var cache = {};
registry.getAllApps = function(params, callback) {
  if(!callback && typeof params === 'function') {
    callback = params;
    params = undefined;
    if(cache.allApps) return callback(cache.allApps, true);
  }
  doGet(params || {}, function(data, success) {
    if(!success) return callback(data, success);
    registry.getAllConnectors(function(connectors, success) {
      data = data.rows;
      var apps = {};
      for(var i in data) apps[data[i].value.name] = data[i].value;
      flagInstalled(apps, function() {
        if(!params) cache.allApps = apps;
        callback(apps, success);
      });
    })
  });
}

function doGet(params, callback) {
    $.getJSON(baseUrl + '/apps/_view/Apps', params, callback);
}

registry.getApp = function(appName, callback) {
  registry.getAllApps(function(apps) {
    callback(apps[appName]);
  });
}

registry.getByAuthor = function(author, callback) {
  registry.getAllApps(function(apps, success) {
    if(!success) return callback(apps, success);
    var authorsApps = {};
    for(var i in apps) {
      if(apps[i].author.name === author) authorsApps[i] = apps[i];
    }
    callback(authorsApps, success);
  });
}


registry.getByFilter = function(filters, callback) {
  registry.getAllApps(function(apps, success) {
    if(!success) return callback(apps, success);
    var filteredApps = {};
    for(var i in apps) {
      if(isMatch(apps[i].repository.uses, filters)) filteredApps[i] = apps[i];
    }
    callback(filteredApps, success);
  });
}

registry.getAllConnectors = function(callback) {
  if(cache.connectors) return callback(cache.connectors, true);
  $.getJSON(baseUrl + '/connectors/_view/Connectors', function(data, success) {
    if(!success) return callback(data, success);
    data = data.rows;
    var connectors = {};
    for(var i in data) connectors[data[i].value.handle] = data[i].value;
    cache.connectors = connectors;
    callback(connectors, success);
  });
}


function getInstalledApps(callback, force) {
  if(cache.myApps !== undefined && !force) return callback(cache.myApps, true);
  $.getJSON('/map', function(map, success) {
    if(!success) return callback(map, success);
    var myApps = {};
    for(var i in map) if(map[i].type === 'app') myApps[i] = map[i];
    cache.myApps = myApps;
    if(typeof callback === 'function') callback(myApps, success);
  }).error(function() {
    cache.myApps = null;
    if(typeof callback === 'function') callback(null);
  });
}

function flagInstalled(apps, callback) {
  if(!loggedIn) return callback();
  getInstalledApps(function(installedApps, success) {
    for(var i in apps) {
      apps[i].actions = {add:true};
      if(installedApps[i]) apps[i].actions.add = false;
    }
    callback();
  });
}

registry.getUnConnectedServices = function(app, callback) {
  if(!app.repository.uses) return callback([]);
  registry.getAllConnectors(function(allConnectors) {
    registry.getMyConnectors(function(myConnectors) {
      if(myConnectors === null) return callback();
      var unconnected = [];
      var svcs = app.repository.uses.services;
      for(var i in svcs) {
        if(!myConnectors[svcs[i]] && allConnectors[svcs[i]]) unconnected.push(allConnectors[svcs[i]]);
      }
      callback(unconnected);
    });
  });
}

registry.getConnectedServices = function(app, callback) {
  if(!app.repository.uses) return callback([]);
  registry.getAllConnectors(function(allConnectors) {
    registry.getMyConnectors(function(myConnectors) {
      if(myConnectors === null) return callback([]);
      var connected = [];
      var svcs = app.repository.uses.services;
      for(var i in svcs) {
        if(myConnectors[svcs[i]] && allConnectors[svcs[i]]) connected.push(allConnectors[svcs[i]]);
      }
      callback(connected);
    });
  });
}

registry.getMyAuthoredApps = function(callback, force) {
  if(cache.myAuthoredApps !== undefined && !force) return callback(cache.myAuthoredApps, true);
  $.getJSON('/map', function(map, success) {
    if(!success) return callback(map, success);
    var myApps = {};                                             // this isn't great
    for(var i in map) if(map[i].type === 'app' && map[i].srcdir.indexOf('Me/github/') === 0) myApps[i] = map[i];
    cache.myAuthoredApps = myApps;
    if(typeof callback === 'function') callback(myApps, success);
  }).error(function() {  
    cache.myAuthoredApps = null;
    if(typeof callback === 'function') callback(null);
  });
}

registry.getMyConnectors = function(callback, force) {
  if(cache.myConnectors !== undefined && !force) return callback(cache.myConnectors, true);
  $.getJSON('/map', function(map, success) {
    if(!success) return callback(map, success);
    var myConnectors = {};
    for(var i in map) if(map[i].type === 'connector' && map[i].authed) myConnectors[i] = map[i];
    cache.myConnectors = myConnectors;
    if(typeof callback === 'function') callback(myConnectors, success);
  }).error(function() {  
    cache.myConnectors = null;
    if(typeof callback === 'function') callback(null);
  });
}

registry.getMap = function(callback) {
  $.getJSON('/map', function(map, success) {
    if(!success) return callback(new Error(map), success);
    return callback(undefined, map);
  });
}

function isMatch(uses, filters) {
  if(!uses) return false;
  if(filters.services && !arrHasAll(uses.services, filters.services)) return false;
  if(filters.types && !arrHasAll(uses.types, filters.types)) return false;
  return true;
}

function arrHasAll(array, values) {
  if(!values) return true;
  if(!array) return false;
  for(var i in values) if(!arrContains(array, values[i])) return false;
  return true;
}

function arrContains(array, value) {
  for(var i in array) if(array[i] === value) return true;
  return false;
}