// parseXML jQuery tests.

var assert = require('chai').assert;
var fs = require('fs');
var $ = require('jquery');

describe('parsexml tests', function() {
  beforeEach(function() {
    var trackString = fs.readFileSync(__dirname + '/track.gpx', 'utf8');
    this.xml = $.parseXML(trackString);
  });

  it('track name', function() {
    var name = $(this.xml).find('trk name').text();
    assert.equal(name, 'Blanes-Tordera-Vallmanya-M.de Deu de Erola-Hortsavinya-Santa. Maria de Montnegre-Blanes');
  });

  it('track description', function() {
    var desc = $(this.xml).find('trk desc').text();
    var cmt = $(this.xml).find('trk cmt').text();
    assert.equal(desc, cmt);
    assert.equal(desc, 'Descripció curta que poso aquí pel test.');
  });

  it('trackpoints', function() {
    var trackpoints = $(this.xml).find('trk trkseg trkpt');
    assert.equal(trackpoints.length, 6);
  });

  it('trackpoint [0] lat', function() {
    var trackpoint = $(this.xml).find('trk trkseg trkpt')[0];
    var lat = $(trackpoint).attr('lat');
    assert.equal(lat, '41.662514');
  });

  it('trackpoint [0] lon', function() {
    var trackpoint = $(this.xml).find('trk trkseg trkpt')[0];
    var lon = $(trackpoint).attr('lon');
    assert.equal(lon, '2.774907');
  });

  it('trackpoint [0] ele', function() {
    var trackpoint = $(this.xml).find('trk trkseg trkpt')[0];
    var ele = $(trackpoint).find('ele').text();
    assert.equal(ele, '-2.3');
  });
  it('trackpoint [0] time', function() {
    var trackpoint = $(this.xml).find('trk trkseg trkpt')[0];
    var time = $(trackpoint).find('time').text();
    assert.equal(time, '2012-08-19T04:47:03Z');
  });

});
