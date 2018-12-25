import React, { Component } from 'react'
import {
  Grid, Row, Col,
  Image,
  Panel,
  Form, FormGroup, InputGroup, ControlLabel, FormControl, HelpBlock, Button, Alert,
  Glyphicon,
} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'

import { storage, api, Address } from 'components'
 
class LoginForm extends Component {

  constructor() {
    super()
    this.state = {
      message: 'Use METAMASK or TRUST WALLET at MAINNET to continue...',
    }
  }
  
  componentDidMount() {
    if (typeof web3 !== 'undefined') {
      web3.currentProvider.enable()
        .then(() => {
          setInterval(() => {
            if (storage.get().address !== web3.eth.defaultAccount) {
              storage.get().set({ address: web3.eth.defaultAccount })
            }
          }, 500)
        })
        .catch((e) => {
          this.setState({ message: 'You have cancelled authorization' })
        })
    } else {
      storage.get().set({ address: undefined })
    }
  }
  
  render() {
    return (
      <Grid>
        <Row style={{ marginTop: 20 }}>
          <Col mdOffset={2} md={8}>
            {false && <Panel header='Check the spelling of the address' bsStyle='warning' className='text-center'>
              <div><b>ALWAYS CHECK THAT YOU ARE HERE</b></div>
              <Image src={url} />
            </Panel>}
            <Panel header='Authorization' bsStyle='danger'>
              {this.state.message}
            </Panel>
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default LoginForm
