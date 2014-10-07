// track.js tests

var assert = require('chai').assert;
var fs = require('fs');
var track = require('../track.js');

describe('Track tests', function() {
  beforeEach(function() {
    this.trackString = fs.readFileSync(__dirname + '/track.gpx', 'utf8');
    this.name = 'track name';
    this.description = 'track description';
  });

  // Check attrs are set / unset
  it('sets track name', function() {
    var t = track.Track(this.trackString, this.name, this.description);
    assert.equal(t.name, this.name);
  });

  it('does not set track name', function() {
    var t = track.Track('');
    assert.notOk(t.name);
  });

  it('sets track description', function() {
    var t = track.Track(this.trackString, this.name, this.description);
    assert.equal(t.description, this.description);
  });

  it('does not set track description', function() {
    var t = track.Track('');
    assert.notOk(t.description);
  });

  // Raise exceptions if wrong argument type
  it('raises a gpxXml type error', function() {
    assert.throws(function() {
      track.Track(1);
    }, 'gpxXML must be a string');
  });

  it('raises a name type error', function() {
    var self = this;
    assert.throws(function() {
      track.Track(self.trackString, 1);
    }, 'name must be a string or nothing');
  });

  it('raises a desciption type error', function() {
    var self = this;
    assert.throws(function() {
      track.Track(self.trackString, 'asd', 1);
    }, 'description must be a string or nothing');
  });

  // xml parsing
  it('sets name from xml', function() {
    var t = track.Track(this.trackString);
    assert.equal(t.name, 'Blanes-Tordera-Vallmanya-M.de Deu de Erola-Hortsavinya-Santa. Maria de Montnegre-Blanes');
  });

  it('sets description from xml', function() {
    var t = track.Track(this.trackString);
    assert.equal(t.description, 'Descripció curta que poso aquí pel test.');
  });

  it('set trackpoint from xml', function() {
    var $ = require('jquery');
    var trackpointXML = $($.parseXML(this.trackString))
      .find('trk trkseg trkpt').first();
    var trackpoint = track.Trackpoint(trackpointXML);
    assert.equal(trackpoint.lat, 41.662514);
    assert.equal(trackpoint.lon, 2.774907);
    assert.equal(trackpoint.ele, -2.3);
    assert.equal(trackpoint.time.getTime(), new Date('2012-08-19T04:47:03Z').getTime());
  });

  it('get trackpoint length', function() {
    var t = track.Track(this.trackString);
    assert.equal(t.points(), 6);
  });

  it('slice trackpoint', function() {
    var t = track.Track(this.trackString);
    var tClone = t.slice(0,2);
    assert.equal(tClone.points(), 2);
  });

  it('gets nearest trackpoint', function() {
    var t = track.Track(this.trackString);
    t.trackpoints.forEach(function(trkPt, idx) {
      // assert.equal(t.nearest(trkPt.lat, trkPt.lon), idx);
    });
  });

  it('gets track elevation', function() {
    var gpxXML = fs.readFileSync(__dirname + '/blanes-tordera-vallmanya-m-de-deu-de-lerola-hortsavinya-santa-maria-de-montnegre-blanes.gpx', 'utf-8');
    var t = track.Track(gpxXML);
    console.log('positiveElevation ' + t.positiveElevation());
    console.log('negativeElevation ' + t.negativeElevation());
    console.log('maxElevation ' + t.maxElevation());
    console.log('minElevation ' + t.minElevation());
    console.log('maxSpeed ' + t.maxSpeed());
    console.log('avgSpeed ' + t.avgSpeed());
    console.log('totalTime ' + t.totalTime());
    console.log('stillTime ' + t.stillTime());
    console.log('movingTime ' + t.movingTime());
    console.log('distance ' + t.distance());
  });
});
