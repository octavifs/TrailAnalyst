/** @jsx React.DOM */
var React = require('react');
React.addons = require('react-addons');


exports.Plot = React.createClass({
  getInitialState: function() {
    return {
      show: false
    };
  },
  render: function() {
      return (
        <div id="plot" className={this.state.show ? '': 'hide'}></div>
      );
  }
});
