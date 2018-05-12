import React, { Component } from 'react'
import {
  Grid, Row, Col,
  Panel,
  Modal,
  Form, FormGroup, ControlLabel, FormControl, HelpBlock, Button, Alert, Label, InputGroup,
  Glyphicon,
} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import InputRange from 'react-input-range'
import 'react-input-range/lib/css/index.css'
import Switch from 'react-toggle-switch'
import 'react-toggle-switch/dist/css/switch.min.css'
import Popup from 'react-popup'
import _ from 'lodash'
import BigNumber from 'bignumber.js'

import 'assets/css/popup.css'

import {storage, api, Address, TxList} from 'components'
 
class Wallet extends Component {

  constructor() {
    super()
    // const gasPricePos = storage.get().netGasPrice + 17
    this.state = {
      gasPrice: this.gasPricePosToValue(22),
      gasPricePos: 22,
      receiver: storage.get().paymentMetaTo || '',
      amount: storage.get().paymentMetaAmount || '',
      validationState: {},
      autoMining: false,
      txSending: false,
      txHash: null,
      txReceiptStatus: 0,
    }
  }
  
  componentDidMount() {
    this.confirmTx = Popup.register({
      title: 'Warning',
      content: 'It is recommended to wait for confirmation of the previous transaction',
      buttons: {
        left: [{
          text: 'OK, mine later',
          className: 'success',
          action: () => {
            Popup.close()
          }
        }],
        right: [{
          text: 'Continue mining',
          className: 'danger',
          action: () => {
            this.mineNext()
            Popup.close()
          }
        }],
      }
    })
    
    this.txChecker = setInterval(() => {
      if (this.state.txHash && !this.state.txReceiptStatus) {
        api.getTransactionReceipt(this.state.txHash)
          .then(({ txReceipt }) => {
            txReceipt && !this.state.txReceiptStatus && this.setState({ txReceiptStatus: txReceipt.logs.length ? 2 : 1 }, () => {
              setTimeout(() => {
                storage.emit('loginform.getuserdata')
                storage.emit('txlist.loaddata')
              }, 10000)
            })
          })
          .catch((e) => {
            // console.warn(e)
          })
      }
    }, 10000)
  }
  
  componentWillUnmount() {
    clearInterval(this.txChecker)
    this.autoMiningInterval && clearInterval(this.autoMiningInterval)
  }
  
  mine() {
    const { gasPrice } = this.state
    const { address } = storage.get()
    this.setState({ txSending: true })
    api.mine(address, '0x' + BigNumber(gasPrice).times('10000000').toString(16))
      .then(({ txHash }) => {
        this.setState({ txHash })
      })
      .catch((e) => {
        this.setState({ txSending: false })
        alert(e)
      })
  }
  
  send() {
    const { gasPrice, receiver, amount } = this.state
    const { address } = storage.get()
    
    this.setState({ txSending: true })
    try {
      api.send(address, Address.anyToHash(receiver), BigNumber(amount).times(storage.get().contractK).toString(16), '0x' + BigNumber(gasPrice).times('10000000').toString(16))
        .then(({ txHash }) => {
          this.setState({ txHash })
        })
        .catch((e) => {
          this.setState({ txSending: false })
          alert(e)
        })
    } catch (e) {
      this.setState({ txSending: false })
      alert(e)
    }
  }
  
  incGasPrice() {
    const {gasPrice, gasPricePos} = this.state
    if (gasPrice < 10) {
      this.setState({gasPrice: gasPrice + 1, gasPricePos: gasPricePos + 1})
    } else if (gasPrice < 100) {
      this.setState({gasPrice: gasPrice + 10, gasPricePos: gasPricePos + 1})
    } else if (gasPrice < 20000) {
      this.setState({gasPrice: gasPrice + 100, gasPricePos: gasPricePos + 1})
    }
  }
  
  decGasPrice() {
    const {gasPrice, gasPricePos} = this.state
    if (gasPrice > 100) {
      this.setState({gasPrice: gasPrice - 100, gasPricePos: gasPricePos - 1})
    } else if (gasPrice > 10) {
      this.setState({gasPrice: gasPrice - 10, gasPricePos: gasPricePos - 1})
    } else if (gasPrice > 1) {
      this.setState({gasPrice: gasPrice - 1, gasPricePos: gasPricePos - 1})
    }
  }
  
  incCustomMineNonce() {
    const customMineNonce = parseInt(this.state.customMineNonce, 10)
    this.setState({customMineNonce: '' + (customMineNonce + 1)})
  }
  
  decCustomMineNonce() {
    const customMineNonce = parseInt(this.state.customMineNonce, 10)
    if (customMineNonce > 0) {
      this.setState({customMineNonce: '' + (customMineNonce - 1)})
    }
  }
  
  incCustomSendNonce() {
    const customSendNonce = parseInt(this.state.customSendNonce, 10)
    this.setState({customSendNonce: '' + (customSendNonce + 1)})
  }
  
  decCustomSendNonce() {
    const customSendNonce = parseInt(this.state.customSendNonce, 10)
    if (customSendNonce > 0) {
      this.setState({customSendNonce: '' + (customSendNonce - 1)})
    }
  }
  
  gasPricePosToValue(pos) {
    if (pos <= 8) {
      return pos + 1
    } else if (pos <= 17) {
      return (pos - 8) * 10
    } else {
      return (pos - 17) * 100
    }
  }
  
  getGasPriceValidationState() {
    const {gasPrice} = this.state
    if (gasPrice < 10) {
      return 'error'
    } else if (gasPrice < 100) {
      return 'warning'
    } else {
      return null
    }
  }
  
  autoMining() {
    const { autoMining } = this.state
    const { canMine } = storage.get()
    this.setState({ autoMining: !autoMining }, () => {
      if (this.state.autoMining) {
        console.log('Mining started')
        this.autoMiningInterval = setInterval(() => {
          if (!canMine) {
            console.log('Mining stopped')
            clearInterval(this.autoMiningInterval)
            this.setState({ autoMining: false })
            return
          }
          
          const { txSending, txReceiptStatus } = this.state
          if (!txSending || txReceiptStatus) {
            this.setState({ txSending: false, txHash: null, txReceiptStatus: 0 }, () => this.mine())
          }
        }, 5000)
      } else {
        console.log('Mining stopped')
        clearInterval(this.autoMiningInterval)
        this.autoMiningInterval = null
      }
    })
  }
  
  render() {
    const { height, width } = this.props
    const { gasPrice, gasPricePos, receiver, amount, validationState, txSending, txHash, txReceiptStatus } = this.state
    const { address, netGasPrice, totalSupply, balanceEther, balanceToken, rate, canMine, minBalance } = storage.get()
    
    return (
      <Grid>
        <Popup />
        <Modal show={txSending}>
          <Modal.Body>
            <div className='text-center'>
              {
                txReceiptStatus === 0 && <FontAwesome name='spinner' spin style={{ fontSize: 36 }} /> ||
                txReceiptStatus === 1 && <FontAwesome name='ban' className='text-danger' style={{ fontSize: 36 }} /> ||
                txReceiptStatus === 2 && <FontAwesome name='check-circle' className='text-success' style={{ fontSize: 36 }} />
              }
              <div>
                Sending transaction...{txHash && <Glyphicon glyph='ok' className='text-success' />}
                {txHash &&
                  <div>
                    <div><a target='_blank' href={'https://etherscan.io/tx/' + txHash}>{txHash}</a></div>
                    <div>
                      Waiting for status (this may take a few minutes)...
                      {txReceiptStatus === 2 && <span className='text-success'>SUCCESS</span> ||
                      txReceiptStatus === 1 && <span className='text-danger'>FAILED</span>}
                    </div>
                  </div>
                }
                {!txReceiptStatus &&
                  <Alert bsStyle='warning'>
                    If more than 10 minutes have passed, you may have set the gas cost too low. Try to reload the page.
                  </Alert>
                }
                {!!txReceiptStatus &&
                  <div>
                    <Button bsStyle='success' onClick={() => this.setState({ txSending: false, txHash: null, txReceiptStatus: 0 })}>OK</Button>
                  </div>
                }
              </div>
            </div>
            <div style={{marginTop: 5, float: 'left'}}>
              <Switch onClick={this.autoMining.bind(this)} on={this.state.autoMining} />
            </div>
            <b>Auto-mining</b>
          </Modal.Body>
        </Modal>
        <Row>
          <Col xs={12}>
            <div className='pull-right'>
              <ControlLabel style={{fontSize: 9}}>Gas price (recommended {netGasPrice} Gwei)</ControlLabel>
              <InputRange
                maxValue={217}
                minValue={0}
                value={gasPricePos}
                formatLabel={(value, type) => {}}
                onChange={value => this.setState({gasPrice: this.gasPricePosToValue(value), gasPricePos: value})}
              />
              <FormGroup validationState={this.getGasPriceValidationState()}>
                <InputGroup>
                  <FormControl type='text' value={(gasPrice / 100).toFixed(2) + ' Gwei'} onChange={() => {}} />
                  <InputGroup.Button>
                    <Button onClick={() => this.decGasPrice()}><Glyphicon glyph="chevron-down" /></Button>
                    <Button onClick={() => this.incGasPrice()}><Glyphicon glyph="chevron-up" /></Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
              <b>{balanceEther} ETH</b><br />
              <b>{balanceToken} {storage.get().tokenName}</b> {rate && <i>({rate} %)</i>}<br />
              <i>Total: {totalSupply} {storage.get().tokenName}</i><br />
              <Button bsSize='large' bsStyle='danger' onClick={() => {
                clearTimeout(storage.get().updater)
                storage.get().set({ address: null, loggingOut: storage.get().gettingUserData })
              }}>Logout</Button>
            </div>
            <div>Your Ethereum and {storage.get().tokenName} address:</div>
            <div><b>{address.addr}</b></div>
            <div>
              <Button bsSize='large' bsStyle='success' disabled={!canMine} onClick={() => this.mine()}>MINE {storage.get().tokenName}</Button>
            </div>
            <div className={'text-' + (canMine ? 'success' : 'danger')}>
              <FontAwesome name={canMine ? 'check-circle' : 'ban'} />{' '}
              <b>You must have at least 0.1% of minted tokens ({minBalance} {storage.get().tokenName}) to get chance for successful mining</b>
            </div>
            <div style={{marginTop: 5, float: 'left'}}>
              <Switch onClick={this.autoMining.bind(this)} on={this.state.autoMining} />
            </div>
            <b>Auto-mining</b>{' '}
            Warning! ETH will be spent for fee and gas! Wallet must be opened for auto-mining!
          </Col>
        </Row>
        <Row style={{marginTop: 5}}>
          <Col xs={12}>
            <Panel header={'Send '+storage.get().tokenName} bsStyle='info'>
              <Form>
                <FormGroup validationState={validationState.receiver && validationState.receiver.type}>
                  <Col xs={12}>
                    <ControlLabel>Send to address</ControlLabel>
                    <FormControl value={receiver} onChange={(event) => this.setState({receiver: event.target.value, sendErrors: []})} />
                    {validationState.receiver && validationState.receiver.message && <HelpBlock>{validationState.receiver.message}</HelpBlock>}
                  </Col>
                </FormGroup>
                <FormGroup validationState={validationState.amount && validationState.amount.type}>
                  <Col xs={12}>
                    <ControlLabel>Amount in {storage.get().tokenName}</ControlLabel>
                    <FormControl value={amount} onChange={(event) => this.setState({amount: event.target.value, sendErrors: []})} />
                    {validationState.amount && validationState.amount.message && <HelpBlock>{validationState.amount.message}</HelpBlock>}
                  </Col>
                </FormGroup>
                <FormGroup>
                  <Col xs={12}>
                    <Button bsStyle='success' onClick={() => this.send()}>Send</Button>
                  </Col>
                </FormGroup>
              </Form>
            </Panel>
          </Col>
        </Row>
        <Row style={{marginTop: 5}}>
          <Col xs={12}>
            <TxList
              address={address.addr}
              height={this.props.height > 800 ? this.props.height - 600 : 200}
            />
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default Wallet
