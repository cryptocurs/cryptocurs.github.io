import React, { Component } from 'react'
import * as R from 'ramda'
import secp256k1 from 'secp256k1'
import bs58 from 'bs58'

import { storage, ls } from 'components'

class IDBProvider extends Component {

  constructor() {
    super()
    this.state = {
      ready: false,
    }
  }
  
  componentDidMount() {
    const request = indexedDB.open(storage.get().config.app.localStoragePrefix + 'dems')
    request.onupgradeneeded = () => {
      const db = request.result
      const storeMessages = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true })
      storeMessages.createIndex('by_user', 'userKey')
      storeMessages.createIndex('by_tx', 'txHash')
      
      const state = ls.read('state')
      if (state && state.messages) {
        R.mapObjIndexed((messages, userKey) => {
          if (userKey.length > 70) {
            userKey = bs58.encode(secp256k1.publicKeyConvert(Buffer.from(userKey, 'base64'), true))
          }
          R.forEach((message) => {
            storeMessages.put({ userKey, ...message })
          }, messages)
        }, state.messages)
      }
    }
    
    request.onsuccess = () => {
      this.idb = request.result
      this.setState({ ready: true })
    }
  }
  
  render() {
    return this.state.ready ? React.Children.map(this.props.children, component => React.cloneElement(component, { idb: this.idb })) : null
  }
}

export default IDBProvider
