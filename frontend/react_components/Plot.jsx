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
    var holder = this.getDOMNode();
    var margin = {top: 20, right: 20, bottom: 30, left: 50};
    var width = holder.clientWidth - margin.right - margin.left;
    var height = holder.clientHeight - margin.top - margin.bottom;
    var x = d3.time.scale()
      .range([0, width]);

    var y = d3.scale.linear()
      .range([height, 0]);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

    var area = d3.svg.area()
      .x(function(d) { return x(d.distanceElapsed); })
      .y0(height)
      .y1(function(d) { return y(d.elevation); });


    var svg = d3.select(holder).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var chart = svg.append("path")
      .datum([])
      .attr("class", "area")
      .attr("d", area);
    // Make this variables available for render()
    this.plot = {
      height: height,
      svg: svg,
      x: x,
      y: y,
      xAxis: xAxis,
      yAxis: yAxis,
      area: area,
      chart: chart
    };
  },
  render: function() {

    if (this.props.track) {
      // Remove previous plot
      this.plot.svg.selectAll("g").remove();
      // Draw current plot
      this.plot.x.domain([0, this.props.track.totalDistance]);
      this.plot.y.domain([this.props.track.minElevation, this.props.track.maxElevation]);

      this.plot.chart
        .datum(this.props.track.segment)
        .transition()
        .duration(750)
        .attr("d", this.plot.area);

      this.plot.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.plot.height + ")")
        .call(this.plot.xAxis);
      this.plot.svg.append("g")
        .attr("class", "y axis")
        .call(this.plot.yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("elevation (m)");
    }
    return (
      <div id="plot" className={this.state.show ? '': 'hide'}>
      </div>
    );
  }
});
