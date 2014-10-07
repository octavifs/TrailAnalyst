/** @jsx React.DOM */
var React = require('react');
React.addons = require('react-addons');


exports.Map = React.createClass({
  getInitialState: function() {
    return {
      map: null,
      trackPolyline: null
    };
  },
  componentDidMount: function() {
    var map = new google.maps.Map(this.getDOMNode());
    // ICC map type
    var iccMapType = new google.maps.ImageMapType({
      getTileUrl: function(coord, zoom) {
        return "http://mapcache.icc.cat/map/bases_noutm/tiles/1.0.0/topo_EPSG900913/"+ zoom +"/"+ coord.x +"/"+coord.y+".jpeg?origin=nw";
      },
      tileSize: new google.maps.Size(256, 256),
      maxZoom:18,
      minZoom:8,
      isPng: true,
      name: 'ICC',
      credit: 'ICC'
    });
    map.mapTypes.set('ICC', iccMapType);
    // IGN.FR map type
    // Very useful link: http://www.jacquet80.eu/blog/post/2013/05/Cartes-IGN-dans-Google-Maps-API
    var ignMapType = new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            return "http://gpp3-wxs.ign.fr/yh1rct40egtoxfx41bmbqa12/geoportail/wmts?LAYER=" +
                "GEOGRAPHICALGRIDSYSTEMS.MAPS" +
                "&EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMTS&VERSION=1.0.0" +
                "&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX=" +
                zoom + "&TILEROW=" + coord.y + "&TILECOL=" + coord.x;
        },
        tileSize: new google.maps.Size(256,256),
        name: 'TopoIGNFR',
        maxZoom: 18
    });
    map.mapTypes.set('IGN.FR', ignMapType);
    // map options
    var mapOptions = {
      center: { lat: 42.23700, lng: 1.69691},
      zoom: 12,
      mapTypeId: 'ICC',
      mapTypeControlOptions: {
         mapTypeIds: [google.maps.MapTypeId.TERRAIN, google.maps.MapTypeId.SATELLITE, 'ICC', 'IGN.FR']
      },
    };
    map.setOptions(mapOptions);
    this.setState({map: map});
  },
  render: function() {
    // If we were displaying a track, remove it
    if (this.state.trackPolyline !== null) {
      this.state.trackPolyline.setMap(null);
    }
    // If a new track is available, display it
    if (this.props.track !== null) {
      var trackCoords = this.props.track.trackpoints.map(function(trackpoint) {
        return new google.maps.LatLng(trackpoint.lat, trackpoint.lon);
      });
      var trackPolyline = new google.maps.Polyline({
        path: trackCoords,
        strokeColor: '#00FFFF',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: this.state.map
      });
      this.state.trackPolyline = trackPolyline;
      // set map bounds
      var bounds = this.props.track.bounds();
      var sw = new google.maps.LatLng(bounds.south, bounds.west);
      var ne = new google.maps.LatLng(bounds.north, bounds.east);
      var mapBounds = new google.maps.LatLngBounds(sw, ne);
      this.state.map.panTo(mapBounds.getCenter());
    }
    return (
      <div id="map-canvas"></div>
    );
  }
});
