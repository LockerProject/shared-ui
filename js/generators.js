function generateAppsHtml(apps, callback, html) {
  if(!html) html = '';
  if(!apps || apps.length <= 0) return callback(html);
  var app = apps.shift();
  getAppAndServices(app._id, function(info) {
    dust.render('app', info, function(err, appHtml) {
      html += appHtml;
      generateAppsHtml(apps, callback, html);
    });
  });
}

function generateAppDetailsHtml(app, callback) {
  if(app.time) app.updated = moment(new Date(app.time.modified)).fromNow();
  // if(app.repository.uses) {
  //     var types = [];
  //     for(var i in app.repository.uses.types) types.push(prettyName(app.repository.uses.types[i]));
  //     app.repository.uses.types = types;
  // }
  registry.getUnConnectedServices(app, function(unconnected) {
    dust.render('appDetails', {app:app, connect:unconnected, signupAvailable: (typeof signupAvailable !== 'undefined' && signupAvailable)}, function(err, appHtml) {
      callback(appHtml);
    });
  });
}

function generateAppFilters(callback) {
  registry.getAllConnectors(function(connectors, success) {
    var connectorsArray = [];

    for (var connector in connectors) {
      if (connectors.hasOwnProperty(connector)) {
        connectorsArray.push(connectors[connector]);
      }
    }

    dust.render('filters', {connectors:connectorsArray}, function(err, html) {
      callback(html);
    });
  });
}

function generateBreadCrumbs(breadcrumbs, callback) {
  dust.render('breadcrumbs', breadcrumbs, function(err, appHtml) {
    callback(appHtml);
  });
}
