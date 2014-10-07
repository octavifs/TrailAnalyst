'use strict';
// Track and TrackPoint classes. They are the base of Trail Analyst. Basically
// those 2 objects are used to represent a GPX XML file and analyze it's data.
// They are the shit and should be treated with respect.
var $ = require('jquery');
var _ = require('lodash');


function deg2rad(deg) {
  return deg * (Math.PI/180);
}
// Using Harvesine formula, for WGS84 coordinates.
// Reference:
// http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points
function harvesineDistance(trackpointA, trackpointB) { // in meters
  var lat1, lon1, lat2, lon2;
  lat1 = trackpointA.lat;
  lon1 = trackpointA.lon;
  lat2 = trackpointB.lat;
  lon2 = trackpointB.lon;
  var R = 6371000; // Radius of the earth in meters
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in meters
  return d;
}

function linearDistance(lat1, lon1, lat2, lon2) {
  // squared euclidean distance between 2 coordinates
  return Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2);
}

exports.Trackpoint = function(trkptXML) {
  // trkptXML is a DOM object.
  var $trkptXML = $(trkptXML);

  var self = {
    lat: parseFloat($trkptXML.attr('lat')),
    lon: parseFloat($trkptXML.attr('lon')),
    ele: parseFloat($trkptXML.find('ele').text()),
    time: new Date($trkptXML.find('time').text())
  };

  return self;
};

exports.Track = function(gpxXML, name, description, trackpoints) {
  // This is the public object we will populate with the track data
  var self = {
    // Track attributes
    name: name,
    description: description,
    // trackpoints is supposed to be a private member, a la python (not enforced, recommended)
    trackpoints: trackpoints,
    // Track instantaneous accessors
    time: function(idx) {
      return self.trackpoints[idx].time;
    },
    timeElapsed: function(idx) {
      // Returns time since start in milliseconds
      var start = self.trackpoints[0].time.getTime();
      var end = self.trackpoints[idx].time.getTime();
      return end - start;
    },
    speed: function(idx) {
      // Instantaneous speed at idx in km/h
      if (idx === 0) {
        return 0;
      }
      var dist = harvesineDistance(self.trackpoints[idx], self.trackpoints[idx - 1]);
      var time = (self.trackpoints[idx].time.getTime() - self.trackpoints[idx - 1].time.getTime());
      // speed = dist / time, as per Newton
      // measures are in metres/ms. Multiply by 3600 you get km/h
      return dist / time * 3600;
    },
    elevation: function(idx) {
      return self.trackpoints[idx].ele;
    },
    ascended: function(idx) {
      var clone = self.slice(0, idx);
      return clone.positiveElevation();
    },
    descended: function(idx) {
      var clone = self.slice(0, idx);
      return clone.negativeElevation();
    },
    slope: function(idx) {
      if (idx === 0) {
        return 0;
      }
      var difX = harvesineDistance(self.trackpoints[idx], self.trackpoints[idx - 1]);
      var difY = self.trackpoints[idx].ele - self.trackpoints[idx - 1].ele;
      // slope. a 45º slope will return 1. <45º => 0, >45º => inf
      return difY / difX
    },
    // Track statistics
    points : function() {
      // total number of points in track
      return self.trackpoints.length;
    },
    distance: function() {
      return _.reduce(self.trackpoints, function(result, currTrkPt, idx, trackpoints) {
        var prevTrkPt = idx > 0 ? trackpoints[idx - 1] : currTrkPt;
        return result + harvesineDistance(currTrkPt, prevTrkPt);
      }, 0);
    },
    totalTime: function() {
      // Return total elapsed time in ms
      return _.reduce(self.trackpoints, function(result, currTrkPt, idx, trackpoints) {
        var prevTrkPt = idx > 0 ? trackpoints[idx - 1] : currTrkPt;
        var timeDiff = currTrkPt.time.getTime() - prevTrkPt.time.getTime();
        return result + timeDiff;
      }, 0);
    },
    movingTime: function() {
      return _.reduce(self.trackpoints, function(result, currTrkPt, idx, trackpoints) {
        var prevTrkPt = idx > 0 ? trackpoints[idx - 1] : currTrkPt;
        var timeDiff = currTrkPt.time.getTime() - prevTrkPt.time.getTime();
        // If we have moved at less than 1km/h, treat as if stopped
        return self.speed(idx) > 1 ? result + timeDiff : result;
      }, 0);
    },
    stillTime: function() {
      return _.reduce(self.trackpoints, function(result, currTrkPt, idx, trackpoints) {
        var prevTrkPt = idx > 0 ? trackpoints[idx - 1] : currTrkPt;
        var timeDiff = currTrkPt.time.getTime() - prevTrkPt.time.getTime();
        // If we have moved at less than 1km/h, treat as if stopped
        return self.speed(idx) > 1 ? result : result + timeDiff;
      }, 0);
    },
    avgSpeed: function() {
      return self.distance() / self.totalTime() * 3600;
    },
    maxSpeed: function() {
      return _.reduce(self.trackpoints, function(result, currTrkPt, idx) {
        var speed = self.speed(idx);
        return speed > result ? speed : result;
      }, 0);
    },
    positiveElevation: function() {
      return _.reduce(self.trackpoints, function(posElevation, currTrkPt, idx, trackpoints) {
        var prevTrkPt = idx > 0 ? trackpoints[idx - 1] : currTrkPt;
        var elevationDiff = currTrkPt.ele - prevTrkPt.ele;
        posElevation = elevationDiff > 0 ? posElevation + elevationDiff : posElevation;
        return posElevation;
      }, 0);
    },
    negativeElevation: function() {
      return _.reduce(self.trackpoints, function(negElevation, currTrkPt, idx, trackpoints) {
        var prevTrkPt = idx > 0 ? trackpoints[idx - 1] : currTrkPt;
        var elevationDiff = currTrkPt.ele - prevTrkPt.ele;
        negElevation = elevationDiff < 0 ? negElevation + elevationDiff : negElevation;
        return negElevation;
      }, 0.0);
    },
    maxElevation: function() {
      return _.max(self.trackpoints, 'ele').ele;
    },
    minElevation: function() {
      return _.min(self.trackpoints, 'ele').ele;
    },
    // Track methods
    slice: function(start, end) {
      return exports.Track(
        '',
        self.name,
        self.description,
        self.trackpoints.slice(start, end)
      );
    },
    nearest: function(lat, lon) {
      // returns idx to trackpoint closer to coordinates
      var bestDistance = Number.MAX_VALUE;
      return _.reduce(self.trackpoints, function(result, currTrkPt, idx) {
        var distance = linearDistance(currTrkPt.lat, currTrkPt.lon, lat, lon);
        if (distance < bestDistance) {
          result = idx;
          bestDistance = distance;
          console.log(bestDistance)
        }
        return result;
      });
    },
    bounds: function() {
      // returns an object with the coordinate bounds of the track. Format:
      // {
      //   north: +latitude,
      //   east: +longitude,
      //   south: -latitude,
      //   west: -longitude
      // }
      return {
        north: _.max(self.trackpoints, 'lat').lat,
        east: _.max(self.trackpoints, 'lon').lon,
        south: _.min(self.trackpoints, 'lat').lat,
        west: _.min(self.trackpoints, 'lon').lon,
      }
    }
  };

  // Check arg types
  if (typeof gpxXML !== 'string') {
    throw new Error('gpxXML must be a string');
  }
  if (typeof self.name !== 'string' && typeof self.name !== 'undefined') {
    throw new Error('name must be a string or nothing');
  }
  if (typeof self.description !== 'string' && typeof self.description !== 'undefined') {
    throw new Error('description must be a string or nothing');
  }

  // Start xml parsing
  var $xml = $($.parseXML(gpxXML));
  self.name = self.name || $xml.find('trk name').text();
  self.description = self.description || $xml.find('trk desc').text() ||
    $xml.find('trk cmt').text();
  var xmlTrackpoints = $xml.find('trk trkseg trkpt');
  // trackpoints is an immutable array of Trackpoint objects
  self.trackpoints = self.trackpoints || _.map(xmlTrackpoints, exports.Trackpoint);

  // equalize filter for elevation
  var filterWindow = 3;
  for (var idx = 0; idx < self.trackpoints.length; idx++) {
    if (idx - filterWindow < 0) {
      continue;
    }
    var normalizedElevation = 0;
    for (var i = 0; i < filterWindow; i++) {
      normalizedElevation += self.trackpoints[idx - i].ele;
    }
    self.trackpoints[idx].ele = normalizedElevation / filterWindow;
  }
  // return the public object
  return self;
};
