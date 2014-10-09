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
  width: 125,
  height: 125,
  transitionDuration: 750,
  scaleArc: function(value) {
    // Transforms value in the range [props.min, props.max] into radians [arcmin, arcmax]
    return d3.scale.linear()
      .domain([this.props.min, this.props.max])
      .range([-Math.PI*2/3, Math.PI*2/3])(value);
  },
  scaleColor: function(value) {
    // Transforms a radius [arcmin, arcmax] into a color [colormin, colormax]
    // This interpolation is done in reverse fashion as to how d3 would usually do it. That is,
    // it interpolates the longest path between colors.
    var colorMin = "hsl(240, 50%, 50%)";
    var colorMax = "hsl(360, 50%, 50%)";
    return d3.interpolateHsl(colorMin, colorMax)(
      d3.scale.linear()
        .domain([-Math.PI*2/3, Math.PI*2/3])
        .range([0, -2])(value)
    );
  },
  componentDidMount: function() {
    // D3 component setup. This function is launched once the DOMNode() is available, and only has
    // to be run on the first render to properly setup the 3D code to construct the SVG graph
    // Further updates with the component will be done via render. Those updates will take care of
    // Animating the gauge configured here.

    // Create SVG container
    var svg = d3.select(this.getDOMNode()).append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      // Create extra centered element. This will hold the arc and text in place.
      .append("g")
        .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");
    // Define the arc start and radius. endAngle will be defined in each arc datum
    var arc = d3.svg.arc()
      .innerRadius(30)
      .outerRadius(50)
      .startAngle(-Math.PI*2/3);
    // Add the background arc (whole range).
    var background = svg.append("path")
      .datum({endAngle: Math.PI*2/3})
      .style("fill", "#CFCFCF")
      .attr("d", arc);

    // Add foreground arc ([min, min] range). Neutral position
    var foreground = svg.append("path")
      .datum({endAngle: -Math.PI*2/3})
      .attr("fill", function(d) {return this.scaleColor(d.endAngle);}.bind(this))
      .attr("d", arc);

    // Add gauge text. No data
    var text = svg.append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text('--');

    // Make arc, gauge and text available for the whole object. Necessary for render() to do its job
    this.arc = arc;
    this.gaugeArc = foreground;
    this.gaugeText = text;
    // Re-render, now with data (if any). Remember that we have to do this since we have only used
    // this method to setup the graph. render() will handle transformations.
    this.render();
  },
  render: function() {
    try {
      // This will trigger an exception on the first render. This is OK and expected. We only want
      // to run this block of code ONCE componentDidMount has been executed and the D3 component
      // has been properly setup.
      this.getDOMNode();
      // Transition from old props to new props while animating the gauge
      var transitionDuration = this.transitionDuration;
      var self = this;
      var arcTween = function(transition, newAngle) {
        transition.attrTween("d", function(d) {
          var interpolate = d3.interpolate(d.endAngle, newAngle);
          return function(t) {
            d.endAngle = interpolate(t);
            return self.arc(d);
          };
        });
        transition.attrTween("fill", function(d) {
          var interpolate = d3.interpolate(d.endAngle, newAngle);
          return function(t) {
            d.endAngle = interpolate(t);
            return self.scaleColor(d.endAngle);
          };
        });
      };
      this.gaugeArc.transition()
        .duration(transitionDuration)
        .call(arcTween, this.scaleArc(this.props.current));
      // Text does not need an animated transition. Simply change the value by the new one.
      this.gaugeText.text(this.props.current + ' ' + this.props.unit);
    } catch(e) {
      // If any other error than the specified is thrown, reraise exception
      if (e.message !== "Invariant Violation: getDOMNode(): A component must be mounted to have a DOM node.") {
        throw e;
      }
    }
    // In case of no exceptions, or if those exceptions have been handled gracefully, return JSX
    // component
    // This case is a little weird, since even if we return this empty div, we are actually adding
    // a ton of stuff to it via D3.
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
