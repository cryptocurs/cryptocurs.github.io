import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import {
  Grid, Row, Col,
  Alert, Button,
  Table,
  Glyphicon,
  Tabs, Tab,
  Nav, NavItem,
  Form, FormGroup, ControlLabel, FormControl,
  Label,
  ProgressBar,
  Badge,
} from 'react-bootstrap'
import Popup from 'react-popup'
import FontAwesome from 'react-fontawesome'
import * as R from 'ramda'
import _ from 'lodash'
import crypto from 'crypto'
import eccrypto from 'eccrypto'
import BigNumber from 'bignumber.js'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import 'assets/css/popup.css'

import {storage, ls, Prompt} from 'components'
import actions from './actions'

@connect(
  (state) => ({
    users: state && state.users || {},
    messages: state && state.messages || {},
    lastBlock: state && state.lastBlock || storage.get().config.createdAtBlock,
    unread: state && state.unread || {},
  }),
  (dispatch) => ({
    actions: bindActionCreators(actions, dispatch),
  })
)
class Messenger extends Component {

  constructor() {
    super()
    this.state = {
      receiver: '',
      msg: '',
      pendingTxs: {},
      sending: false,
      tabKey: 'profile',
    }
    
    this.tokenABI = storage.get().config.contract.abi
    this.TokenABI = web3.eth.contract(this.tokenABI)
    this.tokenContract = this.TokenABI.at(storage.get().config.contract.address.toLowerCase())
    
    this.messagesEnds = {}
  }
  
  componentDidMount() {
    this.eventSendMessage = this.tokenContract.SendMessage({}, { fromBlock: this.props.lastBlock + 1, toBlock: 'latest' })
    this.eventSendMessage.watch((err, res) => {
      console.log('SendMessage', { err, res })
      if (res) {
        console.log(res)
        this.processLog(res.args, res.transactionHash)
        this.props.actions.setLastBlock(res.blockNumber)
      }
    })
    this.scrollToBottom()
    
    this.txChecker = setInterval(() => {
      R.map((txHash) => {
        web3.eth.getTransactionReceipt(txHash, (err, res) => {
          if (res) {
            this.setState({ pendingTxs: R.dissoc(txHash, this.state.pendingTxs) })
          }
        })
      }, R.keys(this.state.pendingTxs))
    }, 5000)
  }
  
  componentDidUpdate() {
    this.scrollToBottom()
  }
  
  componentWillUnmount() {
    this.eventSendMessage.stopWatching()
    clearInterval(this.txChecker)
  }
  
  scrollToBottom = () => {
    R.values(this.messagesEnds).map(el => el.scrollIntoView({ behavior: "smooth" }))
  }
  
  hash(str) {
    return crypto.createHash('sha256').update(str).digest()
  }
  
  sendMessageTo(receiver, sendTo = false) {
    const msgKey = 'msg' + (sendTo ? receiver : '')
    const msg = this.state[msgKey]
    
    const publ = Buffer.from(receiver, 'base64')
    const msgWithAddr = Buffer.concat([storage.get().addressBuffer, Buffer.from(msg, 'utf8')])
    eccrypto.sign(Buffer.from(ls.readRaw('msgPrivKey'), 'hex'), this.hash(msgWithAddr)).then((sign) => {
      eccrypto.encrypt(publ, Buffer.concat([
        Buffer.from([sign.length]),
        sign,
        Buffer.from(ls.readRaw('msgPublKey'), 'base64'),
        msgWithAddr,
      ])).then((enc) => {
        console.log({ enc })
        this.setState({ sending: true, [msgKey]: '' })
        this.tokenContract.sendMessage(
          '0x' + enc.iv.toString('hex'),
          '0x' + enc.ephemPublicKey.toString('hex'),
          '0x' + enc.ciphertext.toString('hex'),
          '0x' + enc.mac.toString('hex'),
          (err, txHash) => {
            console.log('sendMessage', { err, txHash })
            
            this.setState({ sending: false })
            
            if (err) {
              return
            }
            
            const userKey = receiver
            this.setState({ pendingTxs: { ...this.state.pendingTxs, [txHash]: true } })
            this.props.actions.addUser(userKey, { name: userKey.slice(0, 8) + '...' })
            this.props.actions.addMessage(userKey, {
              content: msg,
              isMy: true,
              txHash,
            })
          }
        )
      })
    })
    
  }
  
  sendMessage() {
    this.sendMessageTo(this.state.receiver)
  }
  
  processLog(args, txHash) {
    const priv = Buffer.from(ls.readRaw('msgPrivKey'), 'hex')
    eccrypto.decrypt(priv, {
      iv: Buffer.from(args.iv.slice(2), 'hex'),
      ephemPublicKey: Buffer.from(args.epk.slice(2), 'hex'),
      ciphertext: Buffer.from(args.ct.slice(2), 'hex'),
      mac: Buffer.from(args.mac.slice(2), 'hex'),
    }).then((msg) => {
      const signLength = msg[0]
      const sign = msg.slice(1, signLength + 1)
      const publicKey = msg.slice(signLength + 1, signLength + 66)
      const message = msg.slice(signLength + 66)
      eccrypto.verify(publicKey, this.hash(message), sign).then(() => {
        console.log('Sign ok')
        if (args.sender === '0x' + message.slice(0, 20).toString('hex')) {
          const userKey = publicKey.toString('base64')
          if (R.findIndex(R.propEq('txHash', txHash))(this.props.messages[userKey] || []) >= 0) {
            console.log('Known transaction')
            return
          }
            
          console.log('Message from ' + userKey + ': ' + message.slice(20).toString('utf8'))
          this.props.actions.addUser(userKey, { name: userKey.slice(0, 8) + '...' })
          this.props.actions.addMessage(userKey, {
            content: message.slice(20).toString('utf8'),
            isMy: false,
            txHash,
          })
          if (this.state.tabKey !== userKey) {
            this.props.actions.setUnread(userKey, (this.props.unread[userKey] || 0) + 1)
          }
        } else {
          console.log('Wrong sender')
        }
      }).catch(() => {
        console.log('Wrong sign')
      })
    }).catch((e) => {
      console.log('Not message to me')
    })
  }
  
  handleTabSelect(tabKey) {
    this.setState({ tabKey }, () => {
      this.props.actions.setUnread(tabKey, 0)
      setTimeout(() => this.scrollToBottom(), 500)
    })
  }
  
  render() {
    const { justRegistered } = storage.get()
    const now = (ls.readRaw('state') || '').length / 50000 >> 0
    
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <Tab.Container defaultActiveKey={'profile'} id='tabs' style={this.state.sending ? { display: 'none' } : {}} onSelect={this.handleTabSelect.bind(this)}>
              <Row className='clearfix'>
                <Col sm={12}>
                  <Nav bsStyle='tabs'>
                    <NavItem eventKey='profile'>My profile</NavItem>
                    {R.values(R.mapObjIndexed((user, i) => (
                      <NavItem key={i} eventKey={i}>
                        {user.name}{' '}
                        {this.props.unread[i] && <Badge>{this.props.unread[i]}</Badge> || null}
                      </NavItem>
                    ), this.props.users))}
                  </Nav>
                </Col>
                <Col sm={12}>
                  <Tab.Content animation>
                    <Tab.Pane eventKey='profile'>
                      <h1>Messenger <b className='text-danger'>@RINKEBY</b></h1>
                      <Alert bsStyle='danger'>DON'T USE THIS MESSENGER ON PUBLIC COMPUTERS!!!</Alert>
                      <Alert bsStyle='info'>Note that you cannot restore your outgoing messages by private key! They are stored in your browser!</Alert>
                      <Alert bsStyle='info'>
                        Local storage use: <ProgressBar bsStyle={now > 90 && 'danger' || now > 50 && 'warning' || 'success'} now={now} />
                      </Alert>
                      {justRegistered && <Alert bsStyle='info' onDismiss={() => storage.get().set({ justRegistered: false })}>
                        You have just been registered in DEMS. Save your private key: <FormControl ref={(r) => { this._pk = r; }} value={ls.readRaw('msgPrivKey')} readOnly onClick={() => ReactDOM.findDOMNode(this._pk).select()} />
                        <b>It cannot be restored!</b>
                      </Alert>}
                      <Alert bsStyle='info'>
                        Your public address: <FormControl ref={(r) => { this._fc = r; }} value={ls.readRaw('msgPublKey')} readOnly onClick={() => ReactDOM.findDOMNode(this._fc).select()} />
                      </Alert>
                      <ControlLabel>Public address of receiver</ControlLabel>
                      <FormControl value={this.state.receiver} onChange={(e) => this.setState({ receiver: e.target.value })} />
                      <ControlLabel>Message</ControlLabel>
                      <FormControl value={this.state.msg} onChange={(e) => this.setState({ msg: e.target.value })} />
                      <Button bsStyle='success' onClick={this.sendMessage.bind(this)}>Send</Button>
                    </Tab.Pane>
                    {R.values(R.mapObjIndexed((user, i) => (
                      <Tab.Pane key={i} eventKey={i}>
                        <Grid fluid style={{ height: this.props.height - 300, overflow: 'auto' }}>
                          <Row>
                            {_.map(this.props.messages && this.props.messages[i] || [], (message, i) => (
                              <Col key={'msg'+i} smOffset={message.isMy ? 4 : 0} sm={8}>
                                <Alert bsStyle={message.isMy ? 'warning' : 'success'}>
                                  <div>{message.content}</div>
                                  <small className='pull-right' style={{ fontSize: 10 }}>
                                    {this.state.pendingTxs[message.txHash] && <FontAwesome name='spinner' spin style={{ marginRight: 5 }} />}
                                    <a target='_blank' href={storage.get().config.network.explorerTx + message.txHash}>
                                      {message.txHash.slice(0, 20)}...
                                    </a>
                                  </small>
                                </Alert>
                              </Col>
                            ))}
                          </Row>
                          <div
                            style={{ float:"left", clear: "both" }}
                            ref={ el => { if (el) this.messagesEnds[i] = el } }
                          >
                            {' '}
                          </div>
                        </Grid>
                        <ControlLabel>Message</ControlLabel>
                        <FormControl value={this.state['msg'+i] || ''} onChange={(e) => this.setState({ ['msg'+i]: e.target.value })} />
                        <Button bsStyle='success' onClick={this.sendMessageTo.bind(this, i, true)}>Send</Button>
                      </Tab.Pane>
                    ), this.props.users))}
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
            {this.state.sending && <Alert bsStyle='info' className='text-center' style={{ marginTop: 100 }}>Confirm the transaction in MetaMask</Alert>}
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default Messenger
