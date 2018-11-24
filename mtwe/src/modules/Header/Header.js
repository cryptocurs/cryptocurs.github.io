import React, { Component } from 'react'
import { Grid, Row, Col, Image, Navbar, Nav, NavItem } from 'react-bootstrap'

import {storage} from 'components'

class Header extends Component {

  componentDidMount() {
    
  }
  
  render() {
    return (
      <Navbar>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="#">{storage.get().tokenName} Safe Wallet</a>
          </Navbar.Brand>
        </Navbar.Header>
        <Nav>
          <NavItem eventKey={1} href="/mtwe">
            Main page
          </NavItem>
          <NavItem eventKey={2} href="/mtwe/public/mtwe-en.pdf">
            Whitepaper
          </NavItem>
        </Nav>
      </Navbar>
    )
  }
}

export default Header
