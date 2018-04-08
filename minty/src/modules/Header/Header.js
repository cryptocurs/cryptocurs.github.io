import React, { Component } from 'react'
import { Grid, Row, Col, Image, Navbar, Nav, NavItem } from 'react-bootstrap'

import {storage} from 'components'
import logo from 'assets/images/minty.png'

class Header extends Component {

  componentDidMount() {
    
  }
  
  render() {
    return (
      <Navbar>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="#"><Image className='pull-left' style={{marginTop: -7, marginRight: 5, height: 35}} src={logo} /> {storage.get().tokenName} Safe Wallet</a>
          </Navbar.Brand>
        </Navbar.Header>
        <Nav>
          <NavItem eventKey={1} href="https://minty.pw/">
            Main page
          </NavItem>
        </Nav>
      </Navbar>
    )
  }
}

export default Header
