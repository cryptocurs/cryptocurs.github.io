import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import {
  Grid, Row, Col,
  Alert, ButtonToolbar, Button,
  Table,
  Glyphicon,
  Tabs, Tab,
  Nav, NavItem,
  Form, FormGroup, ControlLabel, FormControl,
  Label,
  ProgressBar,
  Badge,
  Modal,
} from 'react-bootstrap'
import Popup from 'react-popup'
import FontAwesome from 'react-fontawesome'
import * as R from 'ramda'
import _ from 'lodash'
import crypto from 'crypto'
import eccrypto from 'eccrypto'
import secp256k1 from 'secp256k1'
import bs58 from 'bs58'
import BigNumber from 'bignumber.js'
import pako from 'pako'
import moment from 'moment'

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
      sendFile: false,
      sendingFile: {},
      currentMessages: [],
    }
    
    this.tokenABI = storage.get().config.contract.abi
    this.TokenABI = web3.eth.contract(this.tokenABI)
    this.tokenContract = this.TokenABI.at(storage.get().config.contract.address.toLowerCase())
    
    this.messagesEnds = {}
  }
  
  componentDidMount() {
    const users = {}
    R.forEach((userKey) => {
      if (userKey.length > 70) {
        userKey = bs58.encode(secp256k1.publicKeyConvert(Buffer.from(userKey, 'base64'), true))
        users[userKey] = { name: userKey.slice(0, 8) + '...' }
      } else {
        users[userKey] = this.props.users[userKey]
      }
    }, R.keys(this.props.users))
    this.props.actions.replaceUsers(users)
    
    const unread = {}
    R.forEach((userKey) => {
      if (userKey.length > 70) {
        const oldUserKey = userKey
        userKey = bs58.encode(secp256k1.publicKeyConvert(Buffer.from(userKey, 'base64'), true))
        unread[userKey] = this.props.unread[oldUserKey]
      } else {
        unread[userKey] = this.props.unread[userKey]
      }
    }, R.keys(this.props.unread))
    this.props.actions.replaceUnread(unread)
    
    this.eventSendMessage = this.tokenContract.SendMessage({}, { fromBlock: this.props.lastBlock + 1, toBlock: 'latest' })
    this.eventSendMessage.watch((err, res) => {
      console.log('SendMessage', { err, res })
      if (res) {
        console.log(res)
        this.processLog(res.args, res.transactionHash, res.blockNumber)
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
  
  scrollToBottom = (smooth = true) => {
    R.values(this.messagesEnds).map(el => el.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' }))
  }
  
  hash(str) {
    return crypto.createHash('sha256').update(str).digest()
  }
  
  refreshMessages() {
    return new Promise((resolve, reject) => {
      if (this.refreshMessagesTimeout) {
        clearTimeout(this.refreshMessagesTimeout)
      }
      
      this.refreshMessagesTimeout = setTimeout(() => {
        const { tabKey } = this.state
        this.refreshMessagesTimeout = null
        
        if (tabKey !== 'profile') {
          const tx = this.props.idb.transaction('messages', 'readonly')
          const store = tx.objectStore('messages')
          const index = store.index('by_user')
          
          const request = index.openCursor(IDBKeyRange.only(tabKey))
          const currentMessages = []
          request.onsuccess = () => {
            const cursor = request.result
            if (cursor) {
              currentMessages.push({
                ...cursor.value,
                timestamp: cursor.value.timestamp && moment(cursor.value.timestamp * 1000).format('lll'),
              })
              cursor.continue()
            } else {
              this.setState({ currentMessages }, () => resolve())
            }
          }
          request.onerror = () => {
            console.log(request.error)
            this.setState({ currentMessages: [] }, () => resolve())
          }
          tx.onabort = () => {
            console.log(tx.error)
            this.setState({ currentMessages: [] }, () => resolve())
          }
        }
      }, 500)
    })
  }
  
  encryptAndSend(receiver, msgKey, msg, raw = false, fileName = null) {
    const publ = receiver.length < 70 ? secp256k1.publicKeyConvert(bs58.decode(receiver), false) : Buffer.from(receiver, 'base64')
    const originalMsg = this.state[msgKey]
    const msgWithAddr = Buffer.concat([storage.get().addressBuffer, raw ? msg : Buffer.from(msg || originalMsg, 'utf8')])
    eccrypto.sign(Buffer.from(ls.readRaw('msgPrivKey'), 'hex'), this.hash(msgWithAddr)).then((sign) => {
      eccrypto.encrypt(publ, Buffer.concat([
        Buffer.from([sign.length]),
        sign,
        bs58.decode(ls.readRaw('msgPublKey')),
        msgWithAddr,
      ])).then((enc) => {
        console.log({ enc })
        console.log('Before encrypting:', msgWithAddr.length, 'B')
        console.log('After encrypting:', enc.iv.length + enc.ephemPublicKey.length + enc.ciphertext.length + enc.mac.length, 'B')
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
            
            const userKey = bs58.encode(secp256k1.publicKeyConvert(publ, true))
            this.setState({ pendingTxs: { ...this.state.pendingTxs, [txHash]: true } })
            this.props.actions.addUser(userKey, { name: userKey.slice(0, 8) + '...' })
            web3.eth.getBlockNumber((err, blockNumber) => {
              this.props.actions.addMessage(this.props.idb, userKey, {
                content: originalMsg,
                sentFile: raw && fileName,
                isMy: true,
                txHash,
                blockNumber,
                timestamp: moment().unix(),
              })
                .then(() => this.refreshMessages())
            })
          }
        )
      })
    })
  }
  
  sendMessageTo(receiver, sendTo = false) {
    this.encryptAndSend(receiver, 'msg' + (sendTo ? receiver : ''))
  }
  
  sendMessage() {
    this.sendMessageTo(this.state.receiver)
  }
  
  isTxKnown(txHash) {
    return new Promise((resolve, reject) => {
      const tx = this.props.idb.transaction('messages', 'readonly')
      const store = tx.objectStore('messages')
      const index = store.index('by_tx')
      
      const request = index.get(txHash)
      request.onsuccess = () => {
        resolve(!!request.result)
      }
      request.onerror = () => {
        reject(request.error)
      }
      tx.onabort = () => {
        reject(tx.error)
      }
    })
  }
  
  updateMessageTime(txHash, blockNumber) {
    return new Promise((resolve, reject) => {
      const tx = this.props.idb.transaction('messages', 'readonly')
      const store = tx.objectStore('messages')
      const index = store.index('by_tx')
      
      const request = index.get(txHash)
      request.onsuccess = () => {
        if (request.result) {
          web3.eth.getBlock(blockNumber, (err, res) => {
            const tx = this.props.idb.transaction('messages', 'readwrite')
            const store = tx.objectStore('messages')
            
            store.put({ ...request.result, timestamp: res.timestamp })
            
            tx.oncomplete = () => {
              resolve()
            }
            tx.onabort = () => {
              reject(tx.error)
            }
          })
          resolve()
        } else {
          resolve()
        }
      }
      request.onerror = () => {
        reject(request.error)
      }
      tx.onabort = () => {
        reject(tx.error)
      }
    })
  }
  
  processLog(args, txHash, blockNumber) {
    const priv = Buffer.from(ls.readRaw('msgPrivKey'), 'hex')
    eccrypto.decrypt(priv, {
      iv: Buffer.from(args.iv.slice(2), 'hex'),
      ephemPublicKey: Buffer.from(args.epk.slice(2), 'hex'),
      ciphertext: Buffer.from(args.ct.slice(2), 'hex'),
      mac: Buffer.from(args.mac.slice(2), 'hex'),
    }).then((msg) => {
      const signLength = msg[0]
      const sign = msg.slice(1, signLength + 1)
      const compressed = msg[signLength + 1] !== 4
      console.log('processLog', (compressed ? '' : 'un') + 'compressed key')
      const publKeyLength = compressed ? 33 : 65
      const publicKey = msg.slice(signLength + 1, signLength + 1 + publKeyLength)
      const message = msg.slice(signLength + 1 + publKeyLength)
      eccrypto.verify(secp256k1.publicKeyConvert(publicKey, false), this.hash(message), sign).then(() => {
        console.log('processLog Sign ok')
        if (args.sender === '0x' + message.slice(0, 20).toString('hex')) {
          const userKey = bs58.encode(secp256k1.publicKeyConvert(publicKey, true))
          this.isTxKnown(txHash)
            .then((known) => {
              if (known) {
                console.log('processLog Known transaction')
                return
              }
              
              this.props.actions.addUser(userKey, { name: userKey.slice(0, 8) + '...' })
              
              let contentError
              let added = false
              const content = message.slice(20)
              if (content[0] === 0) {
                const contentString = content.toString('utf8')
                const zeroPos = contentString.indexOf('\0', 1)
                if (zeroPos >= 0) {
                  const msg = contentString.slice(1, zeroPos)
                  const zeroPos2 = contentString.indexOf('\0', zeroPos + 1)
                  if (zeroPos2 >= 0) {
                    const name = contentString.slice(zeroPos + 1, zeroPos2)
                    const zeroPos3 = contentString.indexOf('\0', zeroPos2 + 1)
                    if (zeroPos3 >= 0) {
                      const mime = contentString.slice(zeroPos2 + 1, zeroPos3)
                      try {
                        this.props.actions.addMessage(this.props.idb, userKey, {
                          contentRaw: {
                            msg,
                            name,
                            mime,
                            data: Buffer.from(pako.inflate(content.slice(zeroPos3 + 1))).toString('base64'),
                          },
                          isMy: false,
                          txHash,
                          blockNumber,
                        })
                          .then(() => this.updateMessageTime(txHash, blockNumber))
                          .then(() => this.refreshMessages())
                        added = true
                        contentError = -1
                      } catch (e) {
                        contentError = 1
                        console.log(e)
                      }
                    } else {
                      contentError = 1
                      console.log('processLog Wrong format')
                    }
                  } else {
                    contentError = 1
                    console.log('processLog Wrong format')
                  }
                } else {
                  contentError = 1
                  console.log('processLog Wrong format')
                }
              }
              if (!contentError) {
                this.props.actions.addMessage(this.props.idb, userKey, {
                  content: message.slice(20).toString('utf8'),
                  isMy: false,
                  txHash,
                  blockNumber,
                })
                  .then(() => this.updateMessageTime(txHash, blockNumber))
                  .then(() => this.refreshMessages())
                added = true
              }
              if (added && this.state.tabKey !== userKey) {
                this.props.actions.setUnread(userKey, (this.props.unread[userKey] || 0) + 1)
              }
            })
        } else {
          console.log('processLog Wrong sender')
        }
      }).catch(() => {
        console.log('processLog Wrong sign')
      })
    }).catch((e) => {
      console.log('processLog Not message to me')
    })
  }
  
  handleTabSelect(tabKey) {
    if (tabKey === this.state.tabKey) {
      return
    }
    
    const newState = { tabKey, currentMessages: [] }
    if (tabKey !== 'profile') {
      newState['msg' + tabKey] = this.state['msg' + tabKey] || ''
    }
    this.setState(newState, () => {
      if (tabKey !== 'profile') {
        this.props.actions.setUnread(tabKey, 0)
      }
      this.refreshMessages().then(() => this.scrollToBottom(false))
    })
  }
  
  processFiles() {
    const files = ReactDOM.findDOMNode(this.fileUploader).files
    const file = files[0]
    if (!file) {
      return
    }
    
    this.file = file
    this.setState({ sendingFile: {} })
    const reader = new FileReader()
    const _this = this
    reader.onload = function (e) {
      const content = e.target.result
      console.log({ based: Buffer.from(content).toString('base64') })
      _this.setState({ sendingFile: { ..._this.state.sendingFile, initialSize: content.byteLength } }, () => {
        _this.zipped = Buffer.from(pako.deflate(content))
        _this.setState({ sendingFile: { ..._this.state.sendingFile, compressedSize: _this.zipped.length } })
      })
    }
    reader.readAsArrayBuffer(file)
  }
  
  sendFile() {
    this.setState({ sendFile: false, sendingFile: {} }, () => {
      this.encryptAndSend(this.state.tabKey === 'profile' ? this.state.receiver : this.state.tabKey, 'msg' + (this.state.tabKey === 'profile' ? '' : this.state.tabKey), Buffer.concat([
        Buffer.from('\0' +
          this.state['msg' + (this.state.tabKey === 'profile' ? '' : this.state.tabKey)] +
          '\0' +
          (this.file.type.slice(0, 5) === 'image' ? '' : this.file.name) +
          '\0' +
          this.file.type +
          '\0',
        'utf8'),
        this.zipped,
      ]), true, this.file.name)
    })
  }
  
  processMessage(message) {
    if (message.content !== undefined) {
      return <div>
        <div>{message.content}</div>
        {message.sentFile && <small><Glyphicon glyph='file' /> {message.sentFile}</small>}
      </div>
    } else if (message.contentRaw) {
      const { msg, name, mime, data } = message.contentRaw
      if (mime.slice(0, 5) === 'image') {
        return <div>
          {msg !== '' && <div>{msg}</div>}
          <img className='img-responsive' src={'data:' + mime + ';base64,' + data} />
        </div>
      } else {
        return <div>
          {msg !== '' && <div>{msg}</div>}
          <a target='_blank' download={name} href={'data:' + (mime !== '' ? mime : 'application/download') + ';base64,' + data}><Glyphicon glyph='file' /> {name}</a>
        </div>
      }
    }
  }
  
  render() {
    const { sendFile, sendingFile } = this.state
    const { config, justRegistered } = storage.get()
    const now = (ls.readRaw('state') || '').length * 100 / config.app.localStorageLimit >> 0
    
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            {sendFile && <Modal show>
              <Modal.Body>
                Send a file
                <FormControl ref={(r) => { if (r) this.fileUploader = r; }} type='file' onChange={this.processFiles.bind(this)} />
                {sendingFile.initialSize && <div>File size: {sendingFile.initialSize} B</div>}
                {sendingFile.initialSize && !sendingFile.compressedSize && <div>Compressing...</div>}
                {sendingFile.compressedSize && <div>Compressed file size: {sendingFile.compressedSize} B</div>}
                <hr />
                <Button bsStyle='success' disabled={!sendingFile.compressedSize} onClick={this.sendFile.bind(this)}>Send</Button>
                <div className='pull-right'>
                  <Button bsStyle='danger' onClick={() => this.setState({ sendFile: false, sendingFile: {} })}>Cancel</Button>
                </div>
                <div style={{ marginBottom: 50 }}></div>
              </Modal.Body>
            </Modal>}
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
                      <h1>DEMS <b className='text-danger'>@RINKEBY</b></h1>
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
                        <small><i>Old format: {ls.readRaw('msgPublKeyOld')}</i></small>
                      </Alert>
                      <ControlLabel>Public address of receiver</ControlLabel>
                      <FormControl value={this.state.receiver} onChange={(e) => this.setState({ receiver: e.target.value })} />
                      <ControlLabel>Message</ControlLabel>
                      <FormControl value={this.state.msg} onChange={(e) => this.setState({ msg: e.target.value })} />
                      <ButtonToolbar>
                        <Button bsStyle='success' onClick={this.sendMessage.bind(this)}>Send</Button>
                        <Button bsStyle='info' onClick={() => this.setState({ sendFile: true })}>Attach a file...</Button>
                      </ButtonToolbar>
                    </Tab.Pane>
                    {R.values(R.mapObjIndexed((user, i) => (
                      <Tab.Pane key={i} eventKey={i}>
                        <Grid fluid style={{ height: this.props.height - 300, overflow: 'auto' }}>
                          <Row>
                            {_.map(this.state.currentMessages || [], (message, i) => (
                              <Col key={'msg'+i} smOffset={message.isMy ? 4 : 0} sm={8}>
                                <Alert bsStyle={message.isMy ? 'warning' : 'success'}>
                                  <div>{this.processMessage(message)}</div>
                                  <small className='pull-left' style={{ fontSize: 10 }}>
                                    {message.timestamp}
                                  </small>
                                  <small className='pull-right' style={{ fontSize: 10 }}>
                                    {this.state.pendingTxs[message.txHash] && <FontAwesome name='spinner' spin style={{ marginRight: 5 }} />}
                                    <a target='_blank' href={storage.get().config.network.explorerTx + message.txHash}>
                                      {message.txHash.slice(0, 16)}...
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
                        <ButtonToolbar>
                          <Button bsStyle='success' onClick={this.sendMessageTo.bind(this, i, true)}>Send</Button>
                          <Button bsStyle='info' onClick={() => this.setState({ sendFile: true })}>Attach a file...</Button>
                        </ButtonToolbar>
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
