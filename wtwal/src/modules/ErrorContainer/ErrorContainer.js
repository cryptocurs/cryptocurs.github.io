import React, { Component } from 'react'
import { Grid, Row, Col, Image, Navbar, Nav, NavItem } from 'react-bootstrap'

class ErrorContainer extends Component {

  componentDidMount() {
    
  }
  
  render() {
    const { width, height, error } = this.props
    
    return (
      <div style={{ width, height, backgroundColor: 'red', color: 'white' }}>
        <h1>Net Error!</h1>
        <h2>{ error.message || error }</h2>
        Try to reload this page.
      </div>
    )
  }
}

export default ErrorContainer
