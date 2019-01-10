import React, { Component } from 'react'
import {
  Grid, Row, Col,
  Panel,
  Form, FormGroup, ControlLabel, FormControl, HelpBlock, Button, Alert
} from 'react-bootstrap'
import YouTube from 'react-youtube'
import _ from 'lodash'
import crypto from 'crypto'
import eccrypto from 'eccrypto'
import secp256k1 from 'secp256k1'
import bs58 from 'bs58'

import {storage, ls} from 'components'
 
class LoginForm extends Component {

  constructor() {
    super()
    this.state = {
      errors: [],
    }
  }
  
  authorize() {
    if (typeof web3 !== 'undefined') {
      web3.currentProvider.enable()
      web3.version.getNetwork((err, res) => {
        if (res !== storage.get().config.network.id) {
          this.setState({errors: ['You are on the wrong network!']})
          return
        }
        
        const provider = web3.currentProvider
        const address = web3.eth.defaultAccount
        if (address) {
          this.setState({errors: []})
          if (!ls.readRaw('msgPrivKey')) {
            const privKey = crypto.randomBytes(32)
            const publKey = secp256k1.publicKeyCreate(privKey)
            ls.writeRaw('msgPrivKey', privKey.toString('hex'))
            ls.writeRaw('msgPublKey', bs58.encode(publKey))
            storage.get().set({ justRegistered: true })
          }
          
          const msgPublKey = ls.readRaw('msgPublKey')
          
          const addressBuffer = Buffer.from(address.slice(2).toLowerCase(), 'hex')
          storage.get().set({ address, addressBuffer })
          setInterval(() => {
            if (web3.eth.defaultAccount !== address) {
              location.reload()
            }
          }, 1000)
        } else {
          this.setState({errors: ['Please authorize in MetaMask and refresh this page!']})
          setTimeout(() => this.authorize(), 1000)
        }
      })
    } else {
      this.setState({errors: ['Please install MetaMask and refresh this page!']})
    }
  }
  
  componentDidMount() {
    this.authorize()
  }
  
  render() {
    const {errors, address} = this.state
    
    return (
      <Grid>
        <Row>
          <Col smOffset={2} sm={8}>
            {_.map(errors, (error, i) => <Alert key={i} bsStyle='danger'>{error}</Alert>)}
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            {errors.length &&
              <div className='text-center'>
                <a className='btn btn-success btn-lg' target='_blank' href='https://metamask.io/'>Download MetaMask</a><br />
                <YouTube
                  videoId='6Gf_kRE4MJU'
                  opts={{
                    playerVars: {
                      autoplay: 1
                    }
                  }}
                />
              </div> || null
            }
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default LoginForm
