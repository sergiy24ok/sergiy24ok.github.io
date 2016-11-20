requirejs.config({
    baseUrl: 'sonic',
    paths: {
        // the left side is the module ID,
        // the right side is the path to
        // the jQuery file, relative to baseUrl.
        // Also, the path should NOT include
        // the '.js' file extension. This example
        // is using jQuery 1.9.0 located at
        // js/lib/jquery-1.9.0.js, relative to
        // the HTML page.
    }
});

var SonicSocket = require('./sonic-socket.js');
var SonicServer = require('./sonic-server.js');
var SonicCoder = require('./sonic-coder.js');

module.exports = {
  SonicSocket: SonicSocket,
  SonicServer: SonicServer,
  SonicCoder: SonicCoder
}
