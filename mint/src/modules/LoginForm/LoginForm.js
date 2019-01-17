import React, { Component } from 'react'
import {
  Grid, Row, Col,
  Image,
  Panel,
  Form, FormGroup, InputGroup, ControlLabel, FormControl, HelpBlock, Button, Alert,
  Glyphicon,
} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import crypto from 'crypto'
import EthereumUtil from 'ethereumjs-util'
import BigNumber from 'bignumber.js'

import { storage, api, Address } from 'components'
import url from 'assets/images/minturl.png'
 
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
    const {authToken, authUrl} = storage.get()
    
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
    
    if (authUrl) {
      new Promise((resolve, reject) => {
        const { v, r, s } = EthereumUtil.ecsign(crypto.createHash('sha256').update(authToken).digest(), Buffer.from(privateKey, 'hex'))
        api.get(authUrl + address.getPubl().toString('hex') + '/' + v + '/' + r.toString('hex') + '/' + s.toString('hex'))
          .then((res) => {
            if (res.redirect) {
              location.href = res.redirect
            } else {
              reject()
            }
          })
          .catch((e) => {
            reject(e)
          })
      }).then((address) => {
        console.log(address)
      }).catch((e) => {
        this.setState({
          authLoading: false,
          validationState: {
            ...validationState,
            privateKey: {
              type: 'error',
              message: 'Server error',
            },
          },
        })
      })
      return
    }
    
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
          // storage.get().set({ apiError: e })
          console.warn(e)
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
    const {authUrl} = storage.get()
    
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <Alert bsStyle='danger'>mitoken.club is CLOSED! Only this site is the official token site!</Alert>
          </Col>
        </Row>
        <Row>
          <Col md={8}>
            <Panel header='Check the spelling of the address' bsStyle='warning' className='text-center'>
              <div><b>ALWAYS CHECK THAT YOU ARE HERE</b></div>
              <Image src={url} />
            </Panel>
            <Panel header='Authorization' bsStyle='info'>
              {authUrl &&
                <div>
                  <b>You are going to authorize at</b>
                  <Alert bsStyle='info'>{authUrl.length > 30 ? authUrl.slice(0, 30) + '...' : authUrl}</Alert>
                </div>
              }
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
          <Col md={4}>
            <Panel header='About' bsStyle='info'>
              <h2>What is MINT?</h2>
              MINT is MINeable Token working on the Ethereum platform. To mine bitcoin you need to spend electricity. To mine MINT you need to spend some gas. The basic principle: <b>the more you have, the more you will get</b>. MINT can be added to any Ethereum Wallet because it is standard ERC20 token. <b>You must have at least 0.01% (better - 0.0101%) of all MINT to start mining or you will just spend gas!</b>
              <h2>How is mining going?</h2>
              Just press Mine MINT in our Online Wallet and get from 0 to 50000 MINT.
              <h2>Why to buy MINT now?</h2>
              To have more tokens and more chance to get tokens during mining.
              <h2>How can I earn with MINT?</h2>
              You can sell mined tokens on exchange.
            </Panel>
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default LoginForm
