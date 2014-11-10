'use strict';
// Track and TrackPoint classes. They are the base of Trail Analyst. Basically
// those 2 objects are used to represent a GPX XML file and analyze it's data.
// They are the shit and should be treated with respect.
var $ = require('jquery');
var _ = require('lodash');


//////////////////////
// PUBLIC INTERFACE //
//////////////////////
exports.Trackpoint = Trackpoint;
exports.Track = Track;
exports.parseTrack = parseTrack;


///////////////////////
// Private functions //
///////////////////////
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


//////////////////////
// Public functions //
//////////////////////
function Trackpoint(
  lat,
  lon,
  elevation,
  time,
  timeElapsed,
  distance,
  distanceElapsed,
  speed,
  ascended,
  descended,
  slope
) {
  // Basic trackpoint data
  this.lat = lat;
  this.lon = lon;
  this.elevation = elevation;
  this.time = time;
  // Calculated trackpoint data
  this.timeElapsed = timeElapsed;
  this.distance = distance;
  this.distanceElapsed = distanceElapsed;
  this.speed = speed;
  this.ascended = ascended;
  this.descended = descended;
  this.slope = slope;
}


function Track(name, description, segment) {
  ////////////////////////////////////
  // Basic track data is setup here //
  ////////////////////////////////////

  this.name = name;
  this.description = description;
  this.segment = segment;

  ////////////////////////////////
  // Calculate Track statistics //
  ////////////////////////////////

  // total distance by the track (m)
  this.totalDistance = _.reduce(this.segment, function(result, currTrkPt, idx, segment) {
    var prevTrkPt = idx > 0 ? segment[idx - 1] : currTrkPt;
    return result + harvesineDistance(currTrkPt, prevTrkPt);
  }, 0);
  // total time elapsed (ms)
  this.totalTime = _.reduce(this.segment, function(result, currTrkPt, idx, segment) {
    var prevTrkPt = idx > 0 ? segment[idx - 1] : currTrkPt;
    var timeDiff = currTrkPt.time.getTime() - prevTrkPt.time.getTime();
    return result + timeDiff;
  }, 0);
  // total moving time (ms)
  this.movingTime = _.reduce(this.segment, function(result, currTrkPt, idx, segment) {
    var prevTrkPt = idx > 0 ? segment[idx - 1] : currTrkPt;
    var timeDiff = currTrkPt.time.getTime() - prevTrkPt.time.getTime();
    // If we have moved at less than 1km/h, treat as if stopped
    return currTrkPt.speed > 1 ? result + timeDiff : result;
  }, 0);
  // total stopped time (ms)
  this.stillTime =  _.reduce(this.segment, function(result, currTrkPt, idx, segment) {
    var prevTrkPt = idx > 0 ? segment[idx - 1] : currTrkPt;
    var timeDiff = currTrkPt.time.getTime() - prevTrkPt.time.getTime();
    // If we have moved at less than 1km/h, treat as if stopped
    return currTrkPt.speed > 1 ? result : result + timeDiff;
  }, 0);
  // Avg speed (km/h)
  this.avgSpeed = this.totalDistance / this.totalTime * 3600;
  // Max speed (km/h)
  this.maxSpeed = _.reduce(this.segment, function(result, currTrkPt, idx) {
    var speed = currTrkPt.speed;
    return speed > result ? speed : result;
  }, 0);
  // accumulative +elevation (m)
  this.positiveElevation = _.reduce(this.segment, function(posElevation, currTrkPt, idx, segment) {
    var prevTrkPt = idx > 0 ? segment[idx - 1] : currTrkPt;
    var elevationDiff = currTrkPt.elevation - prevTrkPt.elevation;
    posElevation = elevationDiff > 0 ? posElevation + elevationDiff : posElevation;
    return posElevation;
  }, 0);
  // accumulative -elevation (m)
  this.negativeElevation = _.reduce(this.segment, function(negElevation, currTrkPt, idx, segment) {
    var prevTrkPt = idx > 0 ? segment[idx - 1] : currTrkPt;
    var elevationDiff = currTrkPt.elevation - prevTrkPt.elevation;
    negElevation = elevationDiff < 0 ? negElevation + elevationDiff : negElevation;
    return negElevation;
  }, 0.0);
  // max elevation (m)
  this.maxElevation = _.max(this.segment, 'elevation').elevation;
  // min elevation (m)
  this.minElevation = _.min(this.segment, 'elevation').elevation;
}

Track.prototype.slice = function(start, end) {
  var subSegment = this.segment.slice(start, end);
  return new Track(this.name, this.description, subSegment);
};

Track.prototype.nearest = function(lat, lon) {
  // returns idx to trackpoint closer to coordinates
  var bestDistance = Number.MAX_VALUE;
  return _.reduce(this.segment, function(result, currTrkPt, idx) {
    var distance = linearDistance(currTrkPt.lat, currTrkPt.lon, lat, lon);
    if (distance < bestDistance) {
      result = idx;
      bestDistance = distance;
    }
    return result;
  });
};

Track.prototype.bounds = function() {
  // returns an object with the coordinate bounds of the track. Format:
  // {
  //   north: +latitude,
  //   east: +longitude,
  //   south: -latitude,
  //   west: -longitude
  // }
  return {
    north: _.max(this.segment, 'lat').lat,
    east: _.max(this.segment, 'lon').lon,
    south: _.min(this.segment, 'lat').lat,
    west: _.min(this.segment, 'lon').lon,
  }
};

// Async fn call. Parses a gpx xml string and calls cb with the results.
// cb has the blueprint function cb(error, track){}
function parseTrack(gpxXML, cb) {
  // Check arg types
  if (typeof gpxXML !== 'string') {
    return cb(new Error('gpxXML must be a string'));
  }
  if (typeof self.name !== 'string' && typeof self.name !== 'undefined') {
    return cb(new Error('name must be a string or nothing'));
  }
  if (typeof self.description !== 'string' && typeof self.description !== 'undefined') {
    return cb(new Error('description must be a string or nothing'));
  }
  // Start xml parsing
  var $xml = $($.parseXML(gpxXML));
  var name = $xml.find('trk name').text();
  var description = $xml.find('trk desc').text() || $xml.find('trk cmt').text();
  var segment = _.map($xml.find('trk trkseg trkpt'), function(trkptXML) {
    // trkptXML is a DOM object.
    var $trkptXML = $(trkptXML);

    var lat = parseFloat($trkptXML.attr('lat'));
    var lon = parseFloat($trkptXML.attr('lon'));
    var ele = parseFloat($trkptXML.find('ele').text());
    var time = new Date($trkptXML.find('time').text());

    return new Trackpoint(lat, lon, ele, time);
  });

  // calculate timeElapsed
  _.reduce(segment, function(result, trackpoint, idx) {
    var oldTrackpoint = idx > 0 ? segment[idx - 1] : trackpoint;
    var diff = trackpoint.time.getTime() - oldTrackpoint.time.getTime();
    result += diff;
    trackpoint.timeElapsed = result;
    return result;
  }, 0);
  // calculate distance
  _.forEach(segment, function(trackpoint, idx) {
    var oldTrackpoint = idx > 0 ? segment[idx - 1] : trackpoint;
    var distance = harvesineDistance(trackpoint, oldTrackpoint);
    trackpoint.distance = distance;
  });
  // calculate distanceElapsed
  _.reduce(segment, function(result, trackpoint, idx) {
    result += trackpoint.distance;
    trackpoint.distanceElapsed = result;
    return result;
  }, 0);
  // calculate speed
  _.forEach(segment, function(trackpoint, idx) {
    var oldTrackpoint = idx > 0 ? segment[idx - 1] : trackpoint;
    var diffTime = (trackpoint.time.getTime() - oldTrackpoint.time.getTime()) || 1;
    // speed = dist / time, as per Newton
    // measures are in metres/ms. Multiply by 3600 you get km/h
    trackpoint.speed = trackpoint.distance / diffTime * 3600;
  });
  // calculate ascended
  _.reduce(segment, function(result, trackpoint, idx) {
    var oldTrackpoint = idx > 0 ? segment[idx - 1] : trackpoint;
    var diff = trackpoint.elevation - oldTrackpoint.elevation;
    var diffAscend = diff > 0 ? diff : 0;
    result += diffAscend;
    trackpoint.ascended = result;
    return result;
  }, 0);
  // calculate descended
  _.reduce(segment, function(result, trackpoint, idx) {
    var oldTrackpoint = idx > 0 ? segment[idx - 1] : trackpoint;
    var diff = trackpoint.elevation - oldTrackpoint.elevation;
    var diffDescend = diff < 0 ? -diff : 0;
    result += diffDescend;
    trackpoint.descended = result;
    return result;
  }, 0);
  // calculate slope
  _.forEach(segment, function(trackpoint, idx) {
    var oldTrackpoint = idx > 0 ? segment[idx - 1] : trackpoint;
    var difX = trackpoint.distance;
    var difY = trackpoint.elevation - oldTrackpoint.elevation;
    // slope. a 45º slope will return 1. <45º => 0, >45º => inf
    trackpoint.slope = difY / difX
  });

  // Now that we have all data assembled, construct a new track object
  var track = new Track(name, description, segment);
  return cb(null, track);
}
