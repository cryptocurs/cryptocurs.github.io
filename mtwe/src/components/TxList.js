import React, { Component } from 'react'
import {
  Grid, Row, Col,
  Panel,
  Form, FormGroup, ControlLabel, FormControl, HelpBlock, Button, Alert,
  Glyphicon
} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import * as R from 'ramda'
import _ from 'lodash'
import moment from 'moment'
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import BigNumber from 'bignumber.js'
import abiDecoder from 'components/abi-decoder'

import {storage, api, Address} from 'components'
 
class TxList extends Component {

  constructor() {
    super()
    this.state = {
      txs: [],
      pages: -1,
      loading: false,
      currentPage: 0,
      currentPerPage: 20,
    }
    this.mounted = false
    
    this.lastBlockNumber = 0
    storage.get().set({ orders: {} })
  }
  
  setStateSafe(state, callback) {
    this.mounted && this.setState(state, callback)
  }
  
  componentDidMount() {
    this.initialProgress = 0
    storage.get().set({ initialLoadingProgress: 0 })
    this.loadData()
    storage.on('txlist.loaddata', () => this.loadData())
    this.mounted = true
    
    abiDecoder.addABI(JSON.parse('[	{		"constant": true,		"inputs": [],		"name": "name",		"outputs": [			{				"name": "",				"type": "string"			}		],		"payable": false,		"stateMutability": "view",		"type": "function"	},	{		"constant": false,		"inputs": [			{				"name": "_spender",				"type": "address"			},			{				"name": "_value",				"type": "uint256"			}		],		"name": "approve",		"outputs": [			{				"name": "success",				"type": "bool"			}		],		"payable": false,		"stateMutability": "nonpayable",		"type": "function"	},	{		"constant": true,		"inputs": [],		"name": "totalSupply",		"outputs": [			{				"name": "",				"type": "uint256"			}		],		"payable": false,		"stateMutability": "view",		"type": "function"	},	{		"constant": false,		"inputs": [			{				"name": "_from",				"type": "address"			},			{				"name": "_to",				"type": "address"			},			{				"name": "_value",				"type": "uint256"			}		],		"name": "transferFrom",		"outputs": [			{				"name": "success",				"type": "bool"			}		],		"payable": false,		"stateMutability": "nonpayable",		"type": "function"	},	{		"constant": true,		"inputs": [],		"name": "orderCount",		"outputs": [			{				"name": "",				"type": "uint256"			}		],		"payable": false,		"stateMutability": "view",		"type": "function"	},	{		"constant": true,		"inputs": [],		"name": "decimals",		"outputs": [			{				"name": "",				"type": "uint8"			}		],		"payable": false,		"stateMutability": "view",		"type": "function"	},	{		"constant": false,		"inputs": [			{				"name": "id",				"type": "uint256"			}		],		"name": "cancelOrder",		"outputs": [],		"payable": false,		"stateMutability": "nonpayable",		"type": "function"	},	{		"constant": false,		"inputs": [			{				"name": "price",				"type": "uint256"			},			{				"name": "amount",				"type": "uint256"			}		],		"name": "placeBuy",		"outputs": [],		"payable": true,		"stateMutability": "payable",		"type": "function"	},	{		"constant": true,		"inputs": [			{				"name": "",				"type": "address"			}		],		"name": "balanceOf",		"outputs": [			{				"name": "",				"type": "uint256"			}		],		"payable": false,		"stateMutability": "view",		"type": "function"	},	{		"constant": true,		"inputs": [			{				"name": "",				"type": "address"			}		],		"name": "failsOf",		"outputs": [			{				"name": "",				"type": "uint256"			}		],		"payable": false,		"stateMutability": "view",		"type": "function"	},	{		"constant": true,		"inputs": [],		"name": "symbol",		"outputs": [			{				"name": "",				"type": "string"			}		],		"payable": false,		"stateMutability": "view",		"type": "function"	},	{		"constant": true,		"inputs": [			{				"name": "",				"type": "uint256"			}		],		"name": "orders",		"outputs": [			{				"name": "creator",				"type": "address"			},			{				"name": "buy",				"type": "bool"			},			{				"name": "price",				"type": "uint256"			},			{				"name": "amount",				"type": "uint256"			}		],		"payable": false,		"stateMutability": "view",		"type": "function"	},	{		"constant": false,		"inputs": [			{				"name": "_to",				"type": "address"			},			{				"name": "_value",				"type": "uint256"			}		],		"name": "transfer",		"outputs": [],		"payable": false,		"stateMutability": "nonpayable",		"type": "function"	},	{		"constant": false,		"inputs": [			{				"name": "price",				"type": "uint256"			},			{				"name": "amount",				"type": "uint256"			}		],		"name": "placeSell",		"outputs": [],		"payable": false,		"stateMutability": "nonpayable",		"type": "function"	},	{		"constant": false,		"inputs": [			{				"name": "id",				"type": "uint256"			},			{				"name": "amount",				"type": "uint256"			}		],		"name": "fillOrder",		"outputs": [],		"payable": true,		"stateMutability": "payable",		"type": "function"	},	{		"constant": true,		"inputs": [			{				"name": "",				"type": "address"			}		],		"name": "successesOf",		"outputs": [			{				"name": "",				"type": "uint256"			}		],		"payable": false,		"stateMutability": "view",		"type": "function"	},	{		"constant": true,		"inputs": [			{				"name": "",				"type": "address"			},			{				"name": "",				"type": "address"			}		],		"name": "allowance",		"outputs": [			{				"name": "",				"type": "uint256"			}		],		"payable": false,		"stateMutability": "view",		"type": "function"	},	{		"inputs": [],		"payable": false,		"stateMutability": "nonpayable",		"type": "constructor"	},	{		"payable": true,		"stateMutability": "payable",		"type": "fallback"	},	{		"anonymous": false,		"inputs": [			{				"indexed": true,				"name": "from",				"type": "address"			},			{				"indexed": true,				"name": "to",				"type": "address"			},			{				"indexed": false,				"name": "value",				"type": "uint256"			}		],		"name": "Transfer",		"type": "event"	},	{		"anonymous": false,		"inputs": [			{				"indexed": true,				"name": "user",				"type": "address"			},			{				"indexed": false,				"name": "price",				"type": "uint256"			},			{				"indexed": false,				"name": "amount",				"type": "uint256"			},			{				"indexed": false,				"name": "id",				"type": "uint256"			}		],		"name": "PlaceBuy",		"type": "event"	},	{		"anonymous": false,		"inputs": [			{				"indexed": true,				"name": "user",				"type": "address"			},			{				"indexed": false,				"name": "price",				"type": "uint256"			},			{				"indexed": false,				"name": "amount",				"type": "uint256"			},			{				"indexed": false,				"name": "id",				"type": "uint256"			}		],		"name": "PlaceSell",		"type": "event"	},	{		"anonymous": false,		"inputs": [			{				"indexed": true,				"name": "id",				"type": "uint256"			},			{				"indexed": true,				"name": "user",				"type": "address"			},			{				"indexed": false,				"name": "amount",				"type": "uint256"			}		],		"name": "FillOrder",		"type": "event"	},	{		"anonymous": false,		"inputs": [			{				"indexed": true,				"name": "id",				"type": "uint256"			}		],		"name": "CancelOrder",		"type": "event"	}]'))
  }
  
  componentWillUnmount() {
    storage.off('txlist.loaddata')
    this.listUpdater && clearTimeout(this.listUpdater)
    this.mounted = false
  }
  
  loadData() {
    const { address } = this.props
    const { currentPage, currentPerPage } = this.state
    
    if (this.listUpdater) {
      clearTimeout(this.listUpdater)
      this.listUpdater = null
    }
    
    this.setStateSafe({loading: true})
    
    const eventMap = R.fromPairs(R.map(i => [i[1], i[0]], R.toPairs(storage.get().eventHashes)))
    
    console.log('Loading txs')
    api.getLogsAll(this.lastBlockNumber).then(({ logs }) => {
      const myAddr = address.toLowerCase()
      const myAddrTopic = '0x000000000000000000000000' + myAddr.slice(2)
      const orders = R.clone(storage.get().orders || {})
      
      const transactionHashesUsed = {}
      
      R.forEach((event) => {
        const { name } = event
        const params = R.fromPairs(R.map((param) => [ param.name, param.value ], event.events))
        
        if (name === 'PlaceBuy') {
          params.buy = true
          params.priceFormat = BigNumber(params.price).div('1000000000000000000').toFixed(9)
          params.amountFormat = BigNumber(params.amount).div('1000000000000000000').toFixed(9)
          params.amountEtherFormat = BigNumber(params.priceFormat).times(params.amountFormat).toFixed(5)
          params.own = params.user === myAddr
          orders[params.id] = params
        } else if (name === 'PlaceSell') {
          params.buy = false
          params.priceFormat = BigNumber(params.price).div('1000000000000000000').toFixed(9)
          params.amountFormat = BigNumber(params.amount).div('1000000000000000000').toFixed(9)
          params.amountEtherFormat = BigNumber(params.priceFormat).times(params.amountFormat).toFixed(5)
          params.own = params.user === myAddr
          orders[params.id] = params
        } else if (name === 'FillOrder') {
          const bnAmount = BigNumber(orders[params.id].amount).minus(params.amount)
          if (bnAmount.isZero()) {
            delete orders[params.id]
          } else {
            orders[params.id].amount = bnAmount.toString()
            orders[params.id].amountFormat = BigNumber(orders[params.id].amount).div('1000000000000000000').toFixed(9)
            orders[params.id].amountEtherFormat = BigNumber(orders[params.id].priceFormat).times(orders[params.id].amountFormat).toFixed(5)
          }
        } else if (name === 'CancelOrder') {
          delete orders[params.id]
        }
      }, abiDecoder.decodeLogs(logs))
      
      storage.get().set({ orders })
      
      this.setStateSafe({
        pages: Math.ceil(logs.length / currentPerPage),
        txs: [...R.filter(i => i, R.map((log) => {
          const blockNumber = BigNumber(log.blockNumber).toNumber()
          if (blockNumber > this.lastBlockNumber) {
            this.lastBlockNumber = blockNumber + 1
          }
          
          if (transactionHashesUsed[log.transactionHash]) {
            return null
          }
          
          if (R.findIndex(R.propEq('hash', log.transactionHash))(this.state.txs) >= 0) {
            return null
          }
          
          if (!log.topics || !log.topics.length) {
            return null
          }
          
          if (eventMap[log.topics[0]]) {
            transactionHashesUsed[log.transactionHash] = true
            
            if (log.topics[0] !== myAddrTopic && log.topics[1] !== myAddrTopic) {
              return null
            }
            
            return {
              hash: log.transactionHash,
              timeStamp: BigNumber(log.timeStamp).toNumber(),
              fee: BigNumber(log.gasUsed).div('1000000000').times(log.gasPrice).div('1000000000').toFixed(9),
              gasPrice: BigNumber(log.gasPrice).div('1000000000').toString() + ' Gwei',
              txreceipt_status: '1',
              type: eventMap[log.topics[0]],
              outgoing: '',
              amount: '',
            }
          }
          
          if (log.topics[1] !== myAddrTopic && log.topics[2] !== myAddrTopic) {
            return null
          }
          
          const tx = {
            hash: log.transactionHash,
            timeStamp: BigNumber(log.timeStamp).toNumber(),
            fee: BigNumber(log.gasUsed).div('1000000000').times(log.gasPrice).div('1000000000').toFixed(9),
            gasPrice: BigNumber(log.gasPrice).div('1000000000').toString() + ' Gwei',
            txreceipt_status: '1',
            type: log.topics[1] === '0x000000000000000000000000' + storage.get().contractAddressLower.slice(2) ? 'MINE' : 'SEND',
            outgoing: log.topics[1] === '0x000000000000000000000000' + address.slice(2).toLowerCase(),
            amount: BigNumber(log.data).div(storage.get().contractK).toString(),
          }
          if (tx.type === 'MINE') {
            tx.rate = tx.amount !== '0' ? BigNumber(tx.fee).times('1000000').div(tx.amount).toFixed(6) + ' szabo' : 'Unsuccessful attempt'
          } else {
            tx.rate = Address.hashToAddr(log.topics[tx.outgoing ? 2 : 1].slice(26))
          }
          return tx
        }, R.reverse(logs))), ...this.state.txs],
        loading: false,
      }, () => {
        if (this.mounted) {
          if (logs.length > 900) {
            storage.get().set({ initialLoadingProgress: ++this.initialProgress * 100 / (this.initialProgress + 1) })
            this.loadData()
          } else {
            this.props.onInitialLoaded()
            this.listUpdater = setTimeout(() => {
              this.listUpdater = null
              this.loadData()
            }, 20000)
          }
        }
      })
    }).catch((e) => {
      console.warn(e)
      
      if (this.mounted) {
        this.listUpdater = setTimeout(() => {
          this.listUpdater = null
          this.loadData()
        }, 20000)
      }
    })
  }
  
  timeToRel(time) {
    const dd = Math.floor(time / 86400)
    const hh = Math.floor((time - dd * 86400) / 3600)
    const mm = Math.floor((time - dd * 86400 - hh * 3600) / 60)
    const ss = Math.floor(time - dd * 86400 - hh * 3600 - mm * 60)
    
    return (dd ? dd + ' d ' : '')
      + (dd || hh ? _.padStart(hh, 2, '0') + ':' : '')
      + _.padStart(mm, 2, '0') + ':'
      + _.padStart(ss, 2, '0')
  }
  
  fetchData(state) {
    const {pageSize, page} = state
    this.setState({currentPage: page, currentPerPage: pageSize}, () => this.loadData())
  }
  
  onPageSizeChange(currentPerPage) {
    this.setState({ currentPerPage, pages: Math.ceil(this.state.txs.length / currentPerPage) })
  }
  
  getTxType(row) {
    if (row.type) {
      return row.type
    } else if (row.to === storage.get().contractAddressLower && row.value === '0') {
      if (row.input === '0x') {
        return 'MINE'
      } else {
        return 'SEND'
      }
    } else {
      return 'non-' + storage.get().tokenName
    }
  }
  
  render() {
    const {height, address} = this.props
    const {txs, pages, loading} = this.state
    
    const miningTxs = R.filter(R.propEq('type', 'MINE'), txs)
    const miningFee = R.reduce(R.add, 0, R.map(i => i.fee, miningTxs))
    const miningAmount = R.reduce(R.add, 0, R.filter(i => i, R.map(i => i.amount, miningTxs)))
    
    return (
      <div>
        <ReactTable
          style={{height: height - 10, fontSize: 9}}
          data={txs}
          columns={[
            {
              Header: 'Hash',
              accessor: 'hash',
              width: 100,
              Cell: ({value, original}) => <div><a target='_blank' href={storage.get().explorerUrl + 'tx/'+value}>{value.slice(0, 10)}... <Glyphicon glyph='new-window' /></a></div>,
            },
            {
              Header: 'Time',
              accessor: 'timeStamp',
              width: 100,
              Cell: ({value}) => this.timeToRel(moment().unix() - value) + ' ago',
            },
            {
              Header: 'Gas price',
              accessor: 'gasPrice',
              width: 75,
            },
            {
              Header: 'Fee',
              accessor: 'fee',
              width: 125,
              Cell: ({value}) => value + ' ETH',
            },
            /*
            {
              Header: 'Receipt',
              accessor: 'txreceipt_status',
              width: 50,
              Cell: ({value}) => (
                <div className={'text-' + (value === '1' ? 'success' : 'danger')}>
                  <Glyphicon glyph={value === '1' ? 'ok' : 'remove'} />
                </div>
              ),
            },
            */
            {
              Header: 'Type',
              accessor: 'type',
              width: 100,
            },
            {
              Header: 'Amount',
              accessor: 'amount',
              width: 150,
              Cell: ({value, original}) => value === '' ? <div /> : (value !== '0' ? <div>{original.outgoing && <span className='label label-warning'>OUT</span> || <span className='label label-success'>IN</span>} {value} {storage.get().tokenName}</div> : ''),
            },
            {
              Header: 'From / To / 1 ' + storage.get().tokenName + ' =',
              accessor: 'rate',
            },
          ]}
          pages={pages}
          loading={loading}
          minRows={Math.ceil(height / 30)}
          showPageJump={false}
          onPageSizeChange={this.onPageSizeChange.bind(this)}
        />
        <div style={{height: 30}}>
          Mining stats at this page: txs={miningTxs.length} fee={miningFee} ETH amount={miningAmount} {storage.get().tokenName} rate 1 {storage.get().tokenName}={(miningFee * 1000000 / miningAmount).toFixed(6)} szabo
        </div>
      </div>
    )
  }
}

export default TxList
