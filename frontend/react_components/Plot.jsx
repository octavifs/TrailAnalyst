/** @jsx React.DOM */
var React = require('react');
React.addons = require('react-addons');


exports.Plot = React.createClass({
  getInitialState: function() {
    return {
      show: true
    };
  },
  componentDidMount: function() {

  },
  render: function() {
    try {
      this.getDOMNode()
    } catch (e) {
      return (
        <div id="plot" className={this.state.show ? '': 'hide'}>
        </div>
      );
    }
    if (!this.props.track) {
      return (
        <div id="plot" className={this.state.show ? '': 'hide'}>
        </div>
      );
    }
    var holder = this.getDOMNode();
    var margin = {top: 20, right: 20, bottom: 30, left: 50};
    var width = holder.clientWidth - margin.right - margin.left;
    var height = holder.clientHeight - margin.top - margin.bottom;

    var x = d3.time.scale()
      .domain(d3.extent(this.props.track.trackpoints, function(d) { return d.time; }))
      .range([0, width]);

    var y = d3.scale.linear()
      .domain([this.props.track.minElevation(), this.props.track.maxElevation()])
      .range([height, 0]);
    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

    var area = d3.svg.area()
      .x(function(d) { return x(d.time); })
      .y0(height)
      .y1(function(d) { return y(d.ele); });

    var svg = d3.select(holder).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("path")
      .datum(this.props.track.trackpoints)
      .attr("class", "area")
      .attr("d", area);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("elevation (m)");
    return (
      <div id="plot" className={this.state.show ? '': 'hide'}>
      </div>
    );
  }
});
