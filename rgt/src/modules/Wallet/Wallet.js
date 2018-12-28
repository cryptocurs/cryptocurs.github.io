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
import * as R from 'ramda'
import _ from 'lodash'
import BigNumber from 'bignumber.js'
import ethAbi from 'ethjs-abi'

import {storage, api, LS} from 'components'
import { RGT_ABI, TOKEN_ABI } from './abi'
import pkg from 'pkg'

const ETHER = BigNumber('1000000000000000000')
const RGT_ADDR = '0x83668A58Dd17726544f2Dc6fDE40D6D562c04Ab4'
const CONTRACT = web3.eth.contract(RGT_ABI)
const INSTANCE = CONTRACT.at(RGT_ADDR)

class Wallet extends Component {

  constructor() {
    super()
    this.state = {
      balance: '0',
      rgtBalance: '0',
      contractAddress: null,
      contractBalance: null,
      
      forms: {
        sendEther: {},
        call: {},
        addContract: {},
      },
      
      contracts: [
        {
          address: RGT_ADDR,
          name: 'RGT',
          type: 'Token',
          abi: JSON.stringify(TOKEN_ABI),
          default: true,
        },
      ],
      contractMethods: [],
      
      currentContract: null,
      currentContractMethod: null,
      currentContractMethodName: null,
      contractMethodResult: null,
      
      showAddContract: false,
    }
  }
  
  componentWillMount() {
    LS.writeRawIfEmpty('contracts', JSON.stringify(this.state.contracts))
  }
  
  componentDidMount() {
    const updateAll = () => {
      web3.eth.getBalance(storage.get().address, (err, res) => {
        this.setState({ balance: res.div(ETHER).toString(10) })
      })
      INSTANCE.contracts(storage.get().address, (err, res) => {
        if (res !== '0x0000000000000000000000000000000000000000') {
          web3.eth.getBalance(res, (err, balanceRes) => {
            this.setState({ contractAddress: res, contractBalance: balanceRes.div(ETHER).toString(10) })
          })
        } else {
          this.setState({ contractAddress: null, contractBalance: null })
        }
      })
      INSTANCE.balanceOf(storage.get().address, (err, res) => {
        this.setState({ rgtBalance: res.div(ETHER).toString(10) })
      })
    }
    updateAll()
    this._updater = setInterval(() => updateAll(), 5000)
    
    this.setState({ contracts: LS.read('contracts') })
    
    this.handleContractChange(RGT_ADDR)
  }
  
  componentWillUnmount() {
    clearInterval(this._updater)
  }
  
  formControl(formId, fieldId, fieldTitle, componentClass) {
    return <FormGroup key={formId + fieldId}>
      <Col xs={12}>
        <ControlLabel>{fieldTitle}</ControlLabel>
        <FormControl componentClass={componentClass} value={this.state.forms[formId][fieldId] || ''} onChange={(event) => this.setState({ forms: {
          ...this.state.forms,
          [formId]: {
            ...this.state.forms[formId],
            [fieldId]: event.target.value,
          },
        } })} />
      </Col>
    </FormGroup>
  }
  
  send() {
    try {
      INSTANCE.sendEther(this.state.forms.sendEther.to, { value: BigNumber(this.state.forms.sendEther.amount).times(ETHER).toString(10), gas: 250000 }, (err, res) => {
        
      })
    } catch (e) {
      alert(e)
    }
  }
  
  call(event) {
    const { forms, currentContract, currentContractMethod, currentContractMethodName } = this.state
    
    event.preventDefault()
    
    const args = currentContractMethod.inputs && R.map(i => forms.call['arg' + i], R.range(0, currentContractMethod.inputs.length)) || []
    
    this.setState({ contractMethodResult: null }, () => {
      if (currentContractMethod.constant) {
        web3.eth.contract(JSON.parse(currentContract.abi)).at(currentContract.address)[currentContractMethodName](...args, (err, res) => {
          this.setState({ contractMethodResult: res.toString() })
        })
      } else {
        try {
          const abi = ethAbi.encodeMethod(currentContractMethod, args)
          INSTANCE.callMethod(currentContract.address, abi, { value: BigNumber(this.state.forms.call.amount).times(ETHER).toString(), gas: 250000 }, (err, res) => {
            
          })
        } catch (e) {
          this.setState({ contractMethodResult: <div className='text-danger'>{e.message}</div> })
        }
      }
    })
    
    return false
  }
  
  mine() {
    web3.eth.sendTransaction({ to: RGT_ADDR, value: 0, gas: 250000 }, (err, res) => {
      
    })
  }
  
  withdraw() {
    try {
      INSTANCE.withdrawEther({ value: 0, gas: 250000 }, (err, res) => {
        
      })
    } catch (e) {
      alert(e)
    }
  }
  
  handleContractChange(contractAddress) {
    const currentContract = R.find(R.propEq('address', contractAddress))(this.state.contracts)
    if (currentContract) {
      const contractMethods = R.filter(method => method.type === 'function', JSON.parse(currentContract.abi))
      const currentContractMethod = contractMethods[0]
      this.setState({ currentContract, contractMethods }, () => currentContractMethod && this.handleContractMethodChange(currentContractMethod.name))
    }
  }
  
  handleContractMethodChange(contractMethodName) {
    const currentContractMethod = R.find(R.propEq('name', contractMethodName))(this.state.contractMethods)
    if (currentContractMethod) {
      this.setState({
        forms: {
          ...this.state.forms,
          call: {
            amount: '0',
            ...R.fromPairs(R.map(i => [ 'arg' + i, '' ], R.range(0, (currentContractMethod.inputs || []).length))),
          },
        },
        currentContractMethodName: contractMethodName,
        currentContractMethod,
        contractMethodResult: null,
      })
    }
  }
  
  onContractChange(event) {
    this.handleContractChange(event.target.value)
  }
  
  onContractMethodChange(event) {
    this.handleContractMethodChange(event.target.value)
  }
  
  addContract() {
    this.setState({ showAddContract: true })
  }
  
  removeContract() {
    const { contracts, currentContract } = this.state
    
    if (!currentContract.default) {
      this.setState({ contracts: R.filter(i => i.address !== currentContract.address, contracts) }, () => {
        LS.write('contracts', this.state.contracts)
        this.handleContractChange(RGT_ADDR)
      })
    }
  }
  
  submitContract(event) {
    const { address, name, abi } = this.state.forms.addContract
    
    event.preventDefault()
    
    if (address && name && abi && address !== '' && name !== '' && abi !== '') {
      this.setState({
        contracts: [
          ...this.state.contracts,
          { address, name, type: 'Token', abi }
        ],
        showAddContract: false,
      }, () => LS.write('contracts', this.state.contracts))
    }
    
    return false
  }
  
  render() {
    const { balance, rgtBalance, contractAddress, contractBalance, forms, contracts, contractMethods, currentContract, currentContractMethod, contractMethodResult, showAddContract } = this.state
    const { address } = storage.get()
    
    let paramIndex = 0
    
    return (
      <Grid>
        <Row style={{ marginTop: 20 }}>
          <Col sm={12}>
            <h1>RGT Wallet Interface {pkg.version}</h1>
            <a target="_blank" href="RGT.pdf">Whitepaper beta (RU)</a>{' | '}
            <a target="_blank" href={'https://etherscan.io/address/' + RGT_ADDR}>Verified contract</a>
          </Col>
        </Row>
        <Row>
          <Col sm={6}>
            <Panel bsStyle='info'>
              <Panel.Heading>Personal wallet</Panel.Heading>
              <Panel.Body>
                <div className='pull-right'>
                  <Button bsStyle='success' onClick={this.mine.bind(this)}>MINE</Button>
                </div>
                <div style={{ overflow: 'hidden' }}>{ address }</div>
                <div>{ balance } ETH</div>
                <div>{ rgtBalance } RGT</div>
              </Panel.Body>
            </Panel>
            <Panel bsStyle='info'>
              <Panel.Heading>Send Ether to</Panel.Heading>
              <Panel.Body>
                <div className='text-center'>
                  <Glyphicon glyph='user' />
                  <Glyphicon glyph='chevron-right' style={{ marginLeft: 10 }} />
                  <Glyphicon glyph='inbox' style={{ marginLeft: 10 }} />
                  <Glyphicon glyph='chevron-right' style={{ marginLeft: 10 }} />
                  <Glyphicon glyph='user' style={{ marginLeft: 10 }} />
                </div>
                <Form>
                  {this.formControl('sendEther', 'to', 'Send to address')}
                  {this.formControl('sendEther', 'amount', 'Amount (ETH)')}
                  <FormGroup>
                    <Col xs={12}>
                      <Button bsStyle='success' onClick={() => this.send()}>Send</Button>
                    </Col>
                  </FormGroup>
                </Form>
                <small>
                  <b>How it works:</b> the user sends Ether to another user through our contract, receiving tokens RGT for it.
                </small>
              </Panel.Body>
            </Panel>
          </Col>
          <Col sm={6}>
            <Panel bsStyle='info'>
              <Panel.Heading>Contract wallet</Panel.Heading>
              <Panel.Body>
                <div className='pull-right'>
                  <Button bsStyle='success' onClick={this.withdraw.bind(this)}>Withdraw</Button>
                </div>
                {contractAddress &&
                  <div>
                    <div style={{ overflow: 'hidden' }}>{ contractAddress }</div>
                    <div>{ contractBalance } ETH</div>
                  </div> || <div>
                    Not yet created
                  </div>
                }
              </Panel.Body>
            </Panel>
            <Panel bsStyle='info'>
              <Panel.Heading>Interact with any contract</Panel.Heading>
              <Panel.Body>
                <div className='text-center'>
                  <Glyphicon glyph='user' />
                  <Glyphicon glyph='chevron-right' style={{ marginLeft: 10 }} />
                  <Glyphicon glyph='inbox' style={{ marginLeft: 10 }} />
                  <Glyphicon glyph='chevron-right' style={{ marginLeft: 10 }} />
                  <Glyphicon glyph='inbox' style={{ marginLeft: 10 }} />
                </div>
                {showAddContract &&
                  <Form onSubmit={this.submitContract.bind(this)}>
                    {this.formControl('addContract', 'address', 'Address')}
                    {this.formControl('addContract', 'name', 'Name')}
                    {this.formControl('addContract', 'abi', 'ABI', 'textarea')}
                    <FormGroup>
                      <Col xs={12}>
                        <Button type='submit' bsStyle='success'>Add</Button>
                      </Col>
                    </FormGroup>
                  </Form>
                }
                <Form onSubmit={this.call.bind(this)}>
                  <FormGroup>
                    <Col xs={12}>
                      <ControlLabel style={{ float: 'left' }}>Contract</ControlLabel>
                      <div style={{ float: 'right' }}>
                        <FontAwesome style={{ cursor: 'pointer' }} className='text-success' name='plus-circle' onClick={this.addContract.bind(this)} />
                        <FontAwesome style={{ cursor: 'pointer', marginLeft: 5 }} className='text-danger' name='minus-circle' onClick={this.removeContract.bind(this)} />
                      </div>
                      <FormControl componentClass="select" placeholder="select" value={currentContract && currentContract.address || ''} onChange={this.onContractChange.bind(this)}>
                        {R.map((contract) => <option key={contract.address} value={contract.address}>{contract.name} ({contract.type})</option>, contracts)}
                      </FormControl>
                    </Col>
                  </FormGroup>
                  
                  {contractMethods.length &&
                    <div>
                      <FormGroup>
                        <Col xs={12}>
                          <ControlLabel>Method</ControlLabel>
                          <FormControl componentClass="select" placeholder="select" value={currentContractMethod && currentContractMethod.name || ''}  onChange={this.onContractMethodChange.bind(this)}>
                            {R.map((method) => <option key={method.name} value={method.name}>{method.name}({R.join(', ', R.map((input) => input.type + (input.name === '' ? '' : ' ') + input.name, method.inputs || []))})</option>, contractMethods)}
                          </FormControl>
                        </Col>
                      </FormGroup>
                      {this.formControl('call', 'amount', 'Amount (ETH)')}
                      <hr />
                      {R.map((param) => this.formControl('call', 'arg' + paramIndex++, param.type + ' ' + param.name), currentContractMethod && currentContractMethod.inputs || [])}
                      {currentContractMethod && currentContractMethod.constant && <div className='text-danger'>
                        <Glyphicon glyph='warning-sign' /> <b>Note:</b> this is a constant method, so a transaction in the blockchain will not be created, you will not get RGT for this action
                      </div>}
                      <FormGroup>
                        <Col xs={12}>
                          <Button type='submit' bsStyle='success'>Call</Button>
                        </Col>
                      </FormGroup>
                      {contractMethodResult}
                    </div> || <b className='text-danger'>No available methods</b>
                  }
                </Form>
                <small>
                  <b>How it works:</b> the user interacts with other contract through our contract, receiving tokens RGT for it.
                </small>
              </Panel.Body>
            </Panel>
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default Wallet
