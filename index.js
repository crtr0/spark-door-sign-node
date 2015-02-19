var spark = require('spark')
  , ical = require('ical')
  , moment = require('moment-timezone')
  , util = require('util');

var line0, line1, line2, line3;

(function refresh() {
  console.log(moment().format(), ' - Fetching iCal and refreshing display');
  ical.fromURL(process.env.CALENDARS, {}, function(err, data) {
    // find the event that is happening right now that is ending the soonest
    var now = Date.now();
    var event;
    var diff;
    Object.keys(data).forEach(function(key) {
      var e = data[key];
      if (e.start && e.end && e.start.getTime() < now && e.end.getTime() > now) {
        if (diff === undefined || diff > e.end.getTime() - now) {
          diff = e.end.getTime() - now;
          event = e;
        }
      }
    });

    if (event === undefined) {
      line0 = "Carter is free!";
      line1 = "If you see him";
      line2 = "please feel free";
      line3 = "to say hi :)";
    }
    else {
      line0 = "Carter is BUSY" // 14 chars
      line1 = event.summary.substr(0, 20); // 20 chars
      line2 = event.location.substr(0, 10);  // 10 chars
      line3 = "Ends at " + moment(event.end).tz('America/Los_Angeles').format('hh:mm A'); // 16 chars
    }
  
    // This payload length is limited to a max of 64 characters
    // http://docs.spark.io/firmware/
    // However, as of writing this code, I've found anything over 63 will cause an error
    var payload = util.format("%s|%s|%s|%s", line0, line1, line2, line3).substr(0, 63);
  
    spark.login({accessToken: process.env.SPARK_TOKEN})
      .then(function(token) { 
        return spark.callFunction(process.env.SPARK_ID, 'update', payload); })
      .catch(function(error) { console.log(error); })
      .done(function() { setTimeout(refresh, 1000*60*5); } );

  });
}());

var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(util.format('%s\n%s\n%s\n%s', line0, line1, line2, line3));
}).listen(process.env.PORT || 3000, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
