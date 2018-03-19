'use strict'

const EthereumUtil = require('ethereumjs-util')

class Address {

  constructor(privateKey) {
    this.keys = {
      priv: privateKey
    }
    try {
      this.keys.publ = EthereumUtil.privateToPublic(privateKey)
    } catch (e) {
      this.valid = false
      return
    }
    this.hash = EthereumUtil.pubToAddress(this.keys.publ).toString('hex')
    this.addr = EthereumUtil.toChecksumAddress(this.hash)
    this.valid = true
  }
  
  isValid() {
    return this.valid
  }
  
  getPriv() {
    return this.keys.priv
  }
  
  getHash() {
    return this.hash
  }
  
  getAddr() {
    return this.addr
  }
}

module.exports = (...args) => new Address(...args)
module.exports.hashToAddr = (hash) => EthereumUtil.toChecksumAddress(hash)

// addr or hash to hash
module.exports.anyToHash = (address) => address.replace('0x', '').toLowerCase()