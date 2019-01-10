import React, { Component } from 'react'
import { Grid, Row, Col, Image, Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'
import R from 'ramda'

import {storage, api, ls} from 'components'

class Header extends Component {

  componentDidMount() {
    
  }
  
  render() {
    const currentAccount = parseInt(ls.readRaw('currentAccount'))
    
    return (
      <Navbar>
        <Nav>
          <NavItem eventKey={1} onClick={() => this.props.onSelect(1)}>DEMS</NavItem>
        </Nav>
      </Navbar>
    )
  }
}

export default Header
