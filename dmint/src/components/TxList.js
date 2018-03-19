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
  }
  
  setStateSafe(state, callback) {
    this.mounted && this.setState(state, callback)
  }
  
  componentDidMount() {
    this.loadData()
    storage.on('txlist.loaddata', () => this.loadData())
    this.mounted = true
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
    
    api.getLogs(address, this.lastBlockNumber).then(({ logs }) => {
      this.setStateSafe({
        pages: Math.ceil(logs.length / currentPerPage),
        txs: [...R.filter(i => i, R.map((log) => {
          const blockNumber = BigNumber(log.blockNumber).toNumber()
          if (blockNumber > this.lastBlockNumber) {
            this.lastBlockNumber = blockNumber
          }
          
          if (R.findIndex(R.propEq('hash', log.transactionHash))(this.state.txs) >= 0) {
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
            tx.rate = BigNumber(tx.fee).times('1000000').div(tx.amount).toFixed(6) + ' szabo'
          } else {
            tx.rate = Address.hashToAddr(log.topics[tx.outgoing ? 2 : 1].slice(26))
          }
          return tx
        }, R.reverse(logs))), ...this.state.txs],
        loading: false,
      }, () => {
        this.listUpdater = setTimeout(() => {
          this.listUpdater = null
          this.loadData()
        }, 60000)
      })
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
    const miningFee = R.reduce(R.add, 0, R.map(i => i.fee.slice(0, -4), miningTxs))
    const miningAmount = R.reduce(R.add, 0, R.filter(i => i, R.map(i => i.amount, miningTxs)))
    
    return (
      <div>
        <b>Unsuccessful mining transactions are not shown in this list</b>
        <ReactTable
          style={{height: height - 45, fontSize: 9}}
          data={txs}
          columns={[
            {
              Header: 'Hash',
              accessor: 'hash',
              Cell: ({value, original}) => <div><a target='_blank' href={'https://etherscan.io/tx/'+value}>{value} <Glyphicon glyph='new-window' /></a></div>,
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
              width: 100,
            },
            {
              Header: 'Fee',
              accessor: 'fee',
              width: 100,
              Cell: ({value}) => value + ' ETH',
            },
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
            {
              Header: 'Type',
              accessor: 'type',
              width: 50,
            },
            {
              Header: 'Amount',
              accessor: 'amount',
              width: 150,
              Cell: ({value, original}) => value !== '0' ? <div>{original.outgoing && <span className='label label-warning'>OUT</span> || <span className='label label-success'>IN</span>} {value} {storage.get().tokenName}</div> : '',
            },
            {
              Header: 'From / To / 1 ' + storage.get().tokenName + ' =',
              accessor: 'rate',
              width: 150,
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
