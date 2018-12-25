'use strict'

class LS {

  constructor() {
    
  }
  
  readRaw(field) {
    return localStorage.getItem(field)
  }
  
  writeRaw(field, value) {
    localStorage.setItem(field, value)
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
