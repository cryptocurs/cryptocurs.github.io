import React, { Component } from 'react'
import { Grid, Row, Col, Image, Navbar, Nav, NavItem } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'

import {storage} from 'components'

class LoggingOut extends Component {

  componentDidMount() {
    
  }
  
  render() {
    return (
      <div className='text-center' style={{ marginTop: 100 }}>
        <FontAwesome name='spinner' spin style={{ fontSize: 36 }} /><br />
        Logging out...
      </div>
    )
  }
}

export default LoggingOut
