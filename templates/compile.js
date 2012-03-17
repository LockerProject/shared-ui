var dust = require('dust');
var fs = require('fs');
var path = require('path');

var compiled = '';
for(var i = 2; i < process.argv.length; i++) {
  var filename = process.argv[i];
  var text = fs.readFileSync(filename).toString();
  var name = path.basename(filename,'.html');
  compiled += dust.compile(text, name) + '\n';
}

process.stdout.write(compiled);
