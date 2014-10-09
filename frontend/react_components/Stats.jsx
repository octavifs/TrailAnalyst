/** @jsx React.DOM */
var React = require('react');
React.addons = require('react-addons');
var numeral = require('numeral');
var d3 = require('d3');

var Gauge = React.createClass({
  // props that this will use:
  // min -> min value range
  // max -> max value range
  // current -> current value
  // unit -> unit value
  // hsl max (red) -> hsl(360, 50%, 50%)
  // hsl min (blue) -> hsl(240, 50%, 50%)
  scaleArc: function(value) {
    // Transforms value in the range [props.min, props.max] into radians [arcmin, arcmax]
    return d3.scale.linear()
      .domain([this.props.min, this.props.max])
      .range([-Math.PI*2/3, Math.PI*2/3])(value);
  },
  scaleColor: function(value) {
    // Given an arc, return a color
    return d3.interpolateHsl("hsl(240, 50%, 50%)", "hsl(360, 50%, 50%)")(
      d3.scale.linear()
        .domain([-Math.PI*2/3, Math.PI*2/3])
        .range([0, -2])(value)
    );
  },
  componentDidMount: function() {
    // D3 initials setup goes here. This way, render will always handle updates in props
    var width = 200;
    var height = 200;

    // Create the SVG container, and apply a transform such that the origin is the
    // center of the canvas. This way, we don't need to position arcs individually.
    var svg = d3.select(this.getDOMNode()).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    var arc = d3.svg.arc()
      .innerRadius(30)
      .outerRadius(50)
      .startAngle(-Math.PI*2/3);
    // Add the background arc, from 0 to 100% (τ).
    var background = svg.append("path")
      .datum({endAngle: Math.PI*2/3})
      .style("fill", "#CFCFCF")
      .attr("d", arc);

    var foreground = svg.append("path")
      .datum({endAngle: -Math.PI*2/3})
      .attr("fill", function(d) {return this.scaleColor(d.endAngle);}.bind(this))
      .attr("d", arc);

    var text = svg.append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text('--');
    this.arc = arc;
    this.gaugeArc = foreground;
    this.gaugeText = text;
    // Re-render, now with data
    this.render();
  },
  render: function() {
    if (this.arc && this.gaugeArc && this.gaugeText) {
      var transitionDuration = 750;
      var arcTween = function(transition, newAngle) {
        var arc = this.arc;
        transition.attrTween("d", function(d) {
          var interpolate = d3.interpolate(d.endAngle, newAngle);
          return function(t) {
            d.endAngle = interpolate(t);
            return arc(d);
          };
        });
        var self = this;
        transition.attrTween("fill", function(d) {
          var interpolate = d3.interpolate(d.endAngle, newAngle);
          return function(t) {
            d.endAngle = interpolate(t);
            return self.scaleColor(d.endAngle);
          };
        });
      }.bind(this);
      this.gaugeArc.transition()
        .duration(transitionDuration)
        .call(arcTween, this.scaleArc(this.props.current));
      this.gaugeText.text(this.props.current + ' ' + this.props.unit);
    }
    return (
      <div></div>
    );
  }
});

exports.Stats = React.createClass({
  getInitialState: function() {
    return {
      show: true,
      current: 25
    };
  },
  handleChange: function(event) {
    this.setState({current: +event.target.value});
  },
  render: function() {
    if (this.props.track === null) {
      return (
        <div id="stats" className={this.state.show ? '': 'hide'}>
          <Gauge min={0} max={50} current={this.state.current} unit={'km/h'}/>
          <input type="text" value={this.state.current} onChange={this.handleChange}/>
        </div>
      );
    }
    var distance = numeral(this.props.track.distance() / 1000).format('0.00') + 'km'
    var totalTime = numeral(this.props.track.totalTime() / 1000).format('00:00:00') + ' h'
    var movingTime = numeral(this.props.track.movingTime() / 1000).format('00:00:00') + ' h'
    var stillTime = numeral(this.props.track.stillTime() / 1000).format('00:00:00') + ' h'
    var avgSpeed = numeral(this.props.track.avgSpeed()).format('0.00') + ' km/h'
    var maxSpeed = numeral(this.props.track.maxSpeed()).format('0.00') + ' km/h'
    var positiveElevation = numeral(this.props.track.positiveElevation()).format('0') + ' m'
    var negativeElevation = numeral(this.props.track.negativeElevation()).format('0') + ' m'
    var maxElevation = numeral(this.props.track.maxElevation()).format('0') + ' m'
    var minElevation = numeral(this.props.track.minElevation()).format('0') + ' m'
    return (
      <div id="stats" className={this.state.show ? '': 'hide'}>
        <ul>
          <li>Distance: {distance}</li>
          <li>Total time: {totalTime}</li>
          <li>Time moving: {movingTime}</li>
          <li>Time stopped: {stillTime}</li>
          <li>Positive elevation: {positiveElevation}</li>
          <li>Negative elevation: {negativeElevation}</li>
          <li>Max elevation: {maxElevation}</li>
          <li>Min elevation: {minElevation}</li>
        </ul>
      </div>
    );
  }
});
