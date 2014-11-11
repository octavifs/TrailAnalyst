/** @jsx React.DOM */
var React = require('react');
React.addons = require('react-addons');
var d3 = require('d3');


exports.Plot = React.createClass({
  getInitialState: function() {
    return {
      show: true,
      currentIndex: 0
    };
  },
  componentDidMount: function() {
    var holder = this.getDOMNode();
    var margin = {top: 20, right: 20, bottom: 30, left: 50};
    var width = holder.clientWidth - margin.right - margin.left;
    var height = holder.clientHeight - margin.top - margin.bottom;
    var x = d3.scale.linear()
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
      .x(function(d) { return x(d.distanceElapsed / 1000); })
      .y0(height)
      .y1(function(d) { return y(d.elevation); });

    var negativeArea = d3.svg.area()
      .x(function(d) { return x(d.distanceElapsed / 1000); })
      .y0(0)
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

    var negativeChart = svg.append("path")
      .datum([])
      .attr("class", "negative-area")
      .attr("d", negativeArea);

    var currentMark = svg.append("rect")
      .style("fill", "blue")
      .attr("width", 3)
      .attr("height", height)
      .attr("y", 0)
      .attr("x", width + margin.right); // Render further enough so it is not seen

    var currentIndexScale = d3.scale.linear()
      .domain([0, width]);
    // Make this variables available for render()
    this.plot = {
      height: height,
      svg: svg,
      x: x,
      y: y,
      xAxis: xAxis,
      yAxis: yAxis,
      area: area,
      negativeArea: negativeArea,
      chart: chart,
      negativeChart: negativeChart,
      currentMark: currentMark,
      currentIndexScale: currentIndexScale
    };
  },
  render: function() {
    if (this.props.track && this.props.currentIndex != this.state.currentIndex) {
      var trackpoint = this.props.track.segment[this.props.currentIndex];
      // We only do this because we know that this change in state DOES NOT need to trigger another
      // render() call
      this.state.currentIndex = this.props.currentIndex;
      var xCoordinates = this.plot.currentIndexScale.invert(this.state.currentIndex);
      this.plot.currentMark.attr("x", xCoordinates);
    }
    else if (this.props.track) {
      // Remove previous plot
      this.plot.svg.selectAll("g").remove();
      // Draw current plot
      this.plot.x.domain([0, this.props.track.totalDistance / 1000]);
      this.plot.y.domain([this.props.track.minElevation, this.props.track.maxElevation]);
      this.plot.currentIndexScale.rangeRound([0, this.props.track.segment.length]);

      var self = this;
      this.plot.chart
        .datum(this.props.track.segment)
        .transition()
        .duration(750)
        .attr("d", this.plot.area);
      this.plot.chart.on("mousemove", function() {
        var currentIndex = self.plot.currentIndexScale(d3.mouse(this)[0]);
        self.props.onTrack(currentIndex);
      });
      this.plot.negativeChart
        .datum(this.props.track.segment)
        .transition()
        .duration(750)
        .attr("d", this.plot.negativeArea);
      this.plot.negativeChart.on("mousemove", function() {
        var currentIndex = self.plot.currentIndexScale(d3.mouse(this)[0]);
        self.props.onTrack(currentIndex);
      });

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
