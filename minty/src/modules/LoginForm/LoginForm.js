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
import url from 'assets/images/mintyurl.png'
 
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
    
    const getUserData = () => {
      if (this.gettingUserData) {
        return
      }
      this.gettingUserData = true
      if (storage.get().updater) {
        clearTimeout(storage.get().updater)
      }
      console.log('Loading user data')
      return new Promise((resolve, reject) => {
        api.collect([
          api.getGasPrice(),
          api.getTotalSupply(),
          api.getMinted(),
          api.getReducer(),
          api.getBalanceEther(address.addr),
          api.getBalanceToken(address.addr),
        ]).then((res) => {
          this.gettingUserData = false
          res.netGasPrice = BigNumber(res.gasPrice).div('1000000000').toString()
          res.rate = BigNumber(res.balanceToken).times('100').div(res.minted).toFixed(5, BigNumber.ROUND_DOWN)
          res.maximumReward = (500000 / res.reducer).toFixed(4)
          let k = BigNumber(res.rate).times('10').toFixed(0) >> 0
          if (k > 23) {
            k = 23
          }
          k = Math.pow(2, k) >> 0
          k = 5000000 / k >> 0
          res.ownMaximumReward = Math.min((5000000 - k) / 10000, parseFloat(res.maximumReward))
          res.canMine = BigNumber(res.rate).gte('0.1')
          res.updater = setTimeout(() => getUserData(), 60000)
          resolve()
          storage.get().set(res)
        })
        .catch((e) => {
          this.gettingUserData = false
          storage.get().set({ updater: setTimeout(() => getUserData(), 60000) })
          // storage.get().set({ apiError: e })
          console.warn(e)
        })
      })
    }
    
    getUserData().then(() => {
      this.setState({ authLoading: false }, () => storage.get().set({ address }))
    })
    
    storage.on('loginform.getuserdata', () => getUserData())
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
          <Col mdOffset={2} md={8}>
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
        </Row>
      </Grid>
    )
  }
}

export default LoginForm
