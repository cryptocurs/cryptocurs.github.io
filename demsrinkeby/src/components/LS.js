'use strict'

import {storage} from 'components'

class LS {

  constructor() {
    
  }
  
  readRaw(field) {
    return localStorage.getItem(storage.get().config.app.localStoragePrefix + field)
  }
  
  writeRaw(field, value) {
    localStorage.setItem(storage.get().config.app.localStoragePrefix + field, value)
  }
  
  read(field) {
    return JSON.parse(this.readRaw(field))
  }
  
  write(field, value) {
    this.writeRaw(field, JSON.stringify(value))
  }
  
  writeRawIfEmpty(field, value) {
    !this.readRaw(field) && this.writeRaw(field, value)
  }
  
  writeIfEmpty(field, value) {
    !this.readRaw(field) && this.write(field, value)
  }
}

module.exports = new LS
