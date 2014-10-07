/** @jsx React.DOM */
var React = require('react');
React.addons = require('react-addons');

exports.Navbar = React.createClass({
  render: function() {
    var consoleClasses = React.addons.classSet({
      active: this.props.consoleActive
    });
    var playbookClasses = React.addons.classSet({
      hide: !this.props.playbookActive
    });
    return (
      <div className="navbar navbar-inverse navbar-fixed-top" role="navigation">
        <div className="container">
          <div className="navbar-header">
            <strong><a className="navbar-brand" href="#">Trail Analyst</a></strong>
          </div>
        </div>
      </div>
    );
  }
});
