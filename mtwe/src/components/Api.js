'use strict'

import * as R from 'ramda'
import superagent from 'superagent'
import BigNumber from 'bignumber.js'
import EthereumTx from 'ethereumjs-tx'

import { storage } from 'components'

class Api {

  constructor() {
    this.lastApiCall = 0
  }
  
  getTime() {
    return new Date().getTime()
  }
  
  get(url) {
    return new Promise((resolve, reject) => {
      superagent
        .get(url)
        .end((err, res) => {
          if (err) {
            reject(err)
            return
          }
          
          try {
            const text = JSON.parse(res.text)
            resolve(text)
          } catch (e) {
            reject(e)
          }
        })
    })
  }
  
  call(path, returnError = false, attempts = 0) {
    console.log({ path })
    return new Promise((resolve, reject) => {
      if (this.lastApiCall > this.getTime() - 750) {
        console.log('Pending call')
        setTimeout(() => resolve(this.call(path, returnError, attempts)), 500)
        return
      }
      
      this.lastApiCall = this.getTime()
      
      superagent
        .get(storage.get().apiUrl + '?' + path + '&tag=latest&apikey=MYFVN9CMUZC7VA56NJA9RFDFJBVB512SNV')
        .end((err, res) => {
          if (err) {
            reject(err)
            return
          }
          
          try {
            const text = JSON.parse(res.text)
            if (text.result === undefined) {
              throw new Error(text.error && text.error.message || 'Wrong data received')
            } else {
              resolve(text.result)
            }
          } catch (e) {
            if (returnError) {
              reject(e)
            } else if (attempts < 4) {
              console.warn('Net error, attempt #' + (attempts + 2))
              setTimeout(() => resolve(this.call(path, returnError, attempts + 1)), 5000)
            } else {
              // storage.get().set({ apiError: e })
              reject(e)
            }
          }
        })
    })
  }
  
  collect(promises) {
    return new Promise((resolve, reject) => {
      let res = {}
      Promise.all(promises)
        .then((results) => {
          R.forEach((result) => {
            res = { ...res, ...result }
          }, results)
          resolve(res)
        })
        .catch((e) => reject(e))
    })
  }
  
  getGasPrice() {
    return new Promise((resolve, reject) => {
      this.call('module=proxy&action=eth_gasPrice')
        .then((result) => {
          resolve({ gasPrice: BigNumber(result).toFixed(0) })
        })
        .catch((e) => reject(e))
    })
  }
  
  getTotalSupply() {
    return new Promise((resolve, reject) => {
      this.call('module=stats&action=tokensupply&contractaddress=' + storage.get().contractAddress)
        .then((result) => {
          resolve({ totalSupply: BigNumber(result).div(storage.get().contractK).toString() })
        })
        .catch((e) => reject(e))
    })
  }
  
  getBalanceEther(addr) {
    return new Promise((resolve, reject) => {
      this.call('module=account&action=balance&address=' + addr)
        .then((result) => {
          resolve({ balanceEther: BigNumber(result).div('1000000000000000000').toString() })
        })
        .catch((e) => reject(e))
    })
  }
  
  getBalanceToken(addr) {
    return new Promise((resolve, reject) => {
      this.call('module=account&action=tokenbalance&contractaddress=' + storage.get().contractAddress + '&address=' + addr)
        .then((result) => {
          resolve({ balanceToken: BigNumber(result).div(storage.get().contractK).toString() })
        })
        .catch((e) => reject(e))
    })
  }
  
  getMinted() {
    return new Promise((resolve, reject) => {
      this.call('module=proxy&action=eth_call&to=' + storage.get().contractAddress + '&data=0x4f02c420')
        .then((result) => {
          resolve({ minted: BigNumber(result).div(storage.get().contractK).toString() })
        })
        .catch((e) => reject(e))
    })
  }
  
  getReducer() {
    return new Promise((resolve, reject) => {
      this.call('module=proxy&action=eth_call&to=' + storage.get().contractAddress + '&data=0x65fddc81')
        .then((result) => {
          resolve({ reducer: BigNumber(result).toNumber() })
        })
        .catch((e) => reject(e))
    })
  }
  
  getLogs(addr, fromBlock = 0) {
    const address = '0x000000000000000000000000' + addr.slice(2).toLowerCase()
    return new Promise((resolve, reject) => {
      this.call('module=logs&action=getLogs&fromBlock=' + fromBlock + '&toBlock=latest&address=' + storage.get().contractAddress + '&topic1=' + address + '&topic1_2_opr=or' + '&topic2=' + address)
        .then((logs) => {
          resolve({ logs })
        })
        .catch((e) => reject(e))
    })
  }
  
  getLogsAll(fromBlock = 0) {
    return new Promise((resolve, reject) => {
      this.call('module=logs&action=getLogs&fromBlock=' + fromBlock + '&toBlock=latest&address=' + storage.get().contractAddress)
        .then((logs) => {
          resolve({ logs })
        })
        .catch((e) => reject(e))
    })
  }
  
  getTransactionReceipt(txHash) {
    return new Promise((resolve, reject) => {
      this.call('module=proxy&action=eth_getTransactionReceipt&txhash=' + txHash, true)
        .then((txReceipt) => {
          resolve({ txReceipt })
        })
        .catch((e) => reject(e))
    })
  }
  
  getNonce(addr) {
    return new Promise((resolve, reject) => {
      this.call('module=proxy&action=eth_getTransactionCount&address=' + addr)
        .then((nonce) => {
          resolve({ nonce })
        })
        .catch((e) => reject(e))
    })
  }
  
  getBlockNumber() {
    return new Promise((resolve, reject) => {
      this.call('module=proxy&action=eth_blockNumber')
        .then((blockNumber) => {
          resolve({ blockNumber })
        })
        .catch((e) => reject(e))
    })
  }
  
  mine(address, gasPrice) {
    return new Promise((resolve, reject) => {
      this.getNonce(address.addr)
        .then(({ nonce }) => {
          const txParams = {
            nonce,
            gasPrice, 
            gasLimit: '0x030d40',
            to: storage.get().contractAddress,
            value: '0x0',
            data: '',
            chainId: storage.get().chainId,
          }
          return txParams
        }).then((txParams) => {
          const tx = new EthereumTx(txParams)
          tx.sign(address.keys.priv)
          const txRaw = '0x' + tx.serialize().toString('hex')
          return this.call('module=proxy&action=eth_sendRawTransaction&hex=' + txRaw, true)
        }).then((txHash) => {
          resolve({ txHash })
        })
        .catch((e) => reject(e))
    })
  }
  
  send(address, receiver, amount, gasPrice) {
    return new Promise((resolve, reject) => {
      this.getNonce(address.addr)
        .then(({ nonce }) => {
          const txParams = {
            nonce,
            gasPrice, 
            gasLimit: '0x030d40',
            to: storage.get().contractAddress,
            value: '0x00',
            data: '0xa9059cbb000000000000000000000000' + _.padStart(receiver, 40, '0') + _.padStart(amount, 64, '0'),
            chainId: storage.get().chainId,
          }
          return txParams
        }).then((txParams) => {
          const tx = new EthereumTx(txParams)
          tx.sign(address.keys.priv)
          const txRaw = '0x' + tx.serialize().toString('hex')
          return this.call('module=proxy&action=eth_sendRawTransaction&hex=' + txRaw, true)
        }).then((txHash) => {
          resolve({ txHash })
        })
        .catch((e) => reject(e))
    })
  }
  
  buy(address, price, amount, gasPrice) {
    const bnPrice = BigNumber(price)
    const bnAmount = BigNumber(amount).times('1000000000000000000')
    
    return new Promise((resolve, reject) => {
      this.getNonce(address.addr)
        .then(({ nonce }) => {
          const txParams = {
            nonce,
            gasPrice, 
            gasLimit: '0x030d40',
            to: storage.get().contractAddress,
            value: '0x' + bnPrice.times(bnAmount).toString(16),
            data: '0x5d19dcf8' + _.padStart(bnPrice.times('1000000000000000000').toString(16), 64, '0') + _.padStart(bnAmount.toString(16), 64, '0'),
            chainId: storage.get().chainId,
          }
          return txParams
        }).then((txParams) => {
          const tx = new EthereumTx(txParams)
          tx.sign(address.keys.priv)
          const txRaw = '0x' + tx.serialize().toString('hex')
          return this.call('module=proxy&action=eth_sendRawTransaction&hex=' + txRaw, true)
        }).then((txHash) => {
          resolve({ txHash })
        })
        .catch((e) => reject(e))
    })
  }
  
  sell(address, price, amount, gasPrice) {
    const bnPrice = BigNumber(price)
    const bnAmount = BigNumber(amount).times('1000000000000000000')
    
    return new Promise((resolve, reject) => {
      this.getNonce(address.addr)
        .then(({ nonce }) => {
          const txParams = {
            nonce,
            gasPrice, 
            gasLimit: '0x030d40',
            to: storage.get().contractAddress,
            value: '0x00',
            data: '0xa9b4be44' + _.padStart(bnPrice.times('1000000000000000000').toString(16), 64, '0') + _.padStart(bnAmount.toString(16), 64, '0'),
            chainId: storage.get().chainId,
          }
          return txParams
        }).then((txParams) => {
          const tx = new EthereumTx(txParams)
          tx.sign(address.keys.priv)
          const txRaw = '0x' + tx.serialize().toString('hex')
          return this.call('module=proxy&action=eth_sendRawTransaction&hex=' + txRaw, true)
        }).then((txHash) => {
          resolve({ txHash })
        })
        .catch((e) => reject(e))
    })
  }
  
  fillOrder(address, order, amount, gasPrice) {
    const bnId = BigNumber(order.id)
    const bnAmount = BigNumber(amount)
    
    return new Promise((resolve, reject) => {
      this.getNonce(address.addr)
        .then(({ nonce }) => {
          const txParams = {
            nonce,
            gasPrice, 
            gasLimit: '0x030d40',
            to: storage.get().contractAddress,
            value: '0x' + (order.buy ? '00' : bnAmount.times(order.price).toString(16)),
            data: '0xc37dfc5b' + _.padStart(bnId.toString(16), 64, '0') + _.padStart(bnAmount.times('1000000000000000000').toString(16), 64, '0'),
            chainId: storage.get().chainId,
          }
          return txParams
        }).then((txParams) => {
          const tx = new EthereumTx(txParams)
          tx.sign(address.keys.priv)
          const txRaw = '0x' + tx.serialize().toString('hex')
          return this.call('module=proxy&action=eth_sendRawTransaction&hex=' + txRaw, true)
        }).then((txHash) => {
          resolve({ txHash })
        })
        .catch((e) => reject(e))
    })
  }
  
  cancelOrder(address, id, gasPrice) {
    const bnId = BigNumber(id)
    
    return new Promise((resolve, reject) => {
      this.getNonce(address.addr)
        .then(({ nonce }) => {
          const txParams = {
            nonce,
            gasPrice, 
            gasLimit: '0x030d40',
            to: storage.get().contractAddress,
            value: '0x00',
            data: '0x514fcac7' + _.padStart(bnId.toString(16), 64, '0'),
            chainId: storage.get().chainId,
          }
          return txParams
        }).then((txParams) => {
          const tx = new EthereumTx(txParams)
          tx.sign(address.keys.priv)
          const txRaw = '0x' + tx.serialize().toString('hex')
          return this.call('module=proxy&action=eth_sendRawTransaction&hex=' + txRaw, true)
        }).then((txHash) => {
          resolve({ txHash })
        })
        .catch((e) => reject(e))
    })
  }
}

module.exports = new Api
