/** @jsx React.DOM */
var React = require('react');
React.addons = require('react-addons');
var Router = require('react-router');
var Routes = Router.Routes;
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var Track = require('../track.js').Track;

var Map = require('./Map.jsx').Map;
var Navbar = require('./Navbar.jsx').Navbar;

var App = React.createClass({
  getInitialState: function() {
    return {
      ondrag: false,
      track: null
    };
  },
  onDragOverHandler: function(e) {
    e.preventDefault();
  },
  onDragEnterHandler: function(e) {
    e.preventDefault();
    this.setState({ondrag: true});
    console.log(e.dataTransfer.types);
  },
  onDragEndHandler: function  (e) {
    e.preventDefault();
    console.log(e.target);
    console.log('leave triggered!');
    this.setState({ondrag: false});
  },
  onDropHandler: function(e) {
    e.preventDefault();
    this.setState({ondrag: false});
    // Check that user has dropped a file (not a link, or a div). If that were the case, abort
    // event handler
    if (e.dataTransfer.types.length !== 1 || e.dataTransfer.types[0] !== "Files") {
      return;
    }
    var file = e.dataTransfer.files[0];
    // If filename does not end in .gpx, abort
    if (file.name.match(/.*.gpx$/i) == null) {
      return;
    }
    var reader = new FileReader();
    // prepare handler for when reading has finished
    reader.onload = function(e) {
      this.setState({track: Track(e.target.result)});
      console.log(this.state.track);
    }.bind(this)
    // start reading file in async task
    reader.readAsText(file);
  },
  render: function() {
    var style = {
      color: this.state.color
    };
    var ondragOverlayClasses = React.addons.classSet({
      hide: !this.state.ondrag
    });
    console.log(ondragOverlayClasses);

    return (
      <div onDragOver={this.onDragOverHandler} onDragEnter={this.onDragEnterHandler} onDragLeave={this.onDragEndHandler} onDrop={this.onDropHandler}>
        <Navbar/>
        <div id="content">
          // <div id="ondragOverlay" className={ondragOverlayClasses}>
          //   <p> Drop your GPX track here, motherfucker! </p>
          // </div>
          <Map track={this.state.track}/>
        </div>
      </div>
    );
  }
});

React.renderComponent(
  <App />,
  document.body
);
