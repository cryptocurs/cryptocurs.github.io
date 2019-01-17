import React, { Component } from 'react'
import { Grid, Row, Col, Image, Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'

import {storage} from 'components'
import logo from 'assets/images/mint.png'

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
          <NavDropdown eventKey={1} title='Exchanges' id='exchanges-nav-dropdown'>
            <MenuItem eventKey={1.1} onClick={() => window.open('https://etherdelta.com/#MINT-ETH')}>EtherDelta</MenuItem>
            <MenuItem eventKey={1.2} onClick={() => window.open('https://forkdelta.app/#!/trade/MINT-ETH')}>ForkDelta</MenuItem>
            <MenuItem eventKey={1.3} onClick={() => window.open('https://zerofeex2.club/#MINT')}>ZeroFeex</MenuItem>
          </NavDropdown>
          <NavDropdown eventKey={2} title='Support' id='support-nav-dropdown'>
            <MenuItem eventKey={2.1} onClick={() => window.open('https://discord.gg/TeWUf5v')}>Discord</MenuItem>
            <MenuItem eventKey={2.2} onClick={() => window.open('https://gitter.im/mineable/mitoken.club')}>Gitter</MenuItem>
          </NavDropdown>
          <NavDropdown eventKey={3} title='Etherscan' id='etherscan-nav-dropdown'>
            <MenuItem eventKey={3.1} onClick={() => window.open('https://etherscan.io/token/0xea642206310400cda4c1c5b8e7945314aa96b8a7')}>Token Tracker</MenuItem>
            <MenuItem eventKey={3.2} onClick={() => window.open('https://etherscan.io/token/0xea642206310400cda4c1c5b8e7945314aa96b8a7#balances')}>Holders</MenuItem>
            <MenuItem eventKey={3.3} onClick={() => window.open('https://etherscan.io/token/0xea642206310400cda4c1c5b8e7945314aa96b8a7#tokenTrade')}>Trades</MenuItem>
          </NavDropdown>
        </Nav>
      </Navbar>
    )
  }
}

export default Header
