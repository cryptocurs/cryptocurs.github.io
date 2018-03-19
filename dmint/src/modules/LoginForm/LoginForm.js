import React, { Component } from 'react'
import {
  Grid, Row, Col,
  Panel,
  Form, FormGroup, InputGroup, ControlLabel, FormControl, HelpBlock, Button, Alert,
  Glyphicon,
} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import crypto from 'crypto'
import BigNumber from 'bignumber.js'

import { storage, api, Address } from 'components'
 
class LoginForm extends Component {

  constructor() {
    super()
    this.state = {
      privateKey: '',
      authLoading: false,
      generateLoading: false,
      validationState: {},
      newPrivateKey: null,
      showPassword: false,
    }
  }
  
  componentDidMount() {
    
  }
  
  authByKey(privateKey) {
    try {
      const address = Address(Buffer.from(privateKey, 'hex'))
      return address.isValid() ? address : null
    } catch (e) {
      return null
    }
    return null
  }
  
  auth() {
    const { privateKey, validationState } = this.state
    
    const address = this.authByKey(privateKey)
    if (!address) {
      this.setState({
        validationState: {
          ...validationState,
          privateKey: {
            type: 'error',
            message: 'Wrong private key',
          },
        },
      })
      return
    }
    
    this.setState({
      authLoading: true,
      validationState: {
        ...validationState,
        privateKey: {
          type: 'success',
        },
      },
    })
    
    const getUserData = (setTimer = false) => {
      return new Promise((resolve, reject) => {
        api.collect([
          api.getGasPrice(),
          api.getTotalSupply(),
          api.getBalanceEther(address.addr),
          api.getBalanceToken(address.addr),
        ]).then((res) => {
          res.netGasPrice = BigNumber(res.gasPrice).div('1000000000').toString()
          res.rate = BigNumber(res.balanceToken).times('100').div(res.totalSupply).toFixed(5, BigNumber.ROUND_DOWN)
          res.canMine = BigNumber(res.rate).gte('0.01')
          if (setTimer) {
            res.updater = setInterval(() => getUserData(), 60000)
          }
          resolve()
          storage.get().set(res)
        })
        .catch((e) => {
          storage.get().set({ apiError: e })
        })
      })
    }
    
    getUserData(true).then(() => {
      this.setState({ authLoading: false }, () => storage.get().set({ address }))
    })
  }
  
  generate() {
    this.setState({
      newPrivateKey: crypto.randomBytes(32).toString('hex'),
    })
  }
  
  render() {
    const {privateKey, authLoading, generateLoading, validationState, newPrivateKey, showPassword} = this.state
    
    return (
      <Grid>
        <Row>
          <Col smOffset={2} sm={8}>
            <Panel header='Authorization' bsStyle='info'>
              <Form>
                <FormGroup validationState={validationState.privateKey && validationState.privateKey.type}>
                  <ControlLabel>Your Ethereum private key</ControlLabel>
                  <InputGroup>
                    <FormControl type={showPassword ? 'text' : 'password'} value={privateKey} onChange={(event) => this.setState({privateKey: event.target.value})} />
                    {validationState.privateKey && validationState.privateKey.message && <HelpBlock>{validationState.privateKey.message}</HelpBlock>}
                    <InputGroup.Button>
                      <Button onClick={() => this.setState({showPassword: !showPassword})}><Glyphicon glyph="eye-open" /></Button>
                    </InputGroup.Button>
                  </InputGroup>
                </FormGroup>
                <div>
                  <Button bsStyle='success' onClick={() => this.auth()} disabled={authLoading}>{authLoading && <FontAwesome name='spinner' spin />}Authorize</Button>
                  <Button style={{marginLeft: 5}} bsStyle='info' onClick={() => this.generate()} disabled={generateLoading}>Generate new private key</Button>
                </div>
                {newPrivateKey && <Alert style={{marginTop: 5}} bsStyle='success'>Your private key:<br /><b>{newPrivateKey}</b><br />DID YOU SAVE IT?</Alert>}
              </Form>
            </Panel>
            <Panel header='We respect your privacy' bsStyle='info'>
              Your private key is not transmitted to our servers. Your private key is stored only on your computer and only for the duration of the session with the wallet.
            </Panel>
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default LoginForm
