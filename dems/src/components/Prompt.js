import React, { Component } from 'react'

class Prompt extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.props.defaultValue
    };

    this.onChange = (e) => this._onChange(e);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.value !== this.state.value) {
      this.props.onChange(this.state.value);
    }
  }

  _onChange(e) {
    let value = e.target.value;

    this.setState({value: value});
  }

  render() {
    return (
      <div>
        <input type="text" placeholder={this.props.placeholder} className="mm-popup__input" value={this.state.value} onChange={this.onChange} />
        {this.props.hint && <i>{this.props.hint}</i>}
      </div>
    )
  }
}

export default Prompt
