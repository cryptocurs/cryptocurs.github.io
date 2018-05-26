export const ADD_USER = 'Messenger/ADD_USER'
export const ADD_MESSAGE = 'Messenger/ADD_MESSAGE'
export const SET_LAST_BLOCK = 'Messenger/SET_LAST_BLOCK'
export const SET_UNREAD = 'Messenger/SET_UNREAD'
export const REPLACE_USERS = 'Messenger/REPLACE_USERS'
export const REPLACE_UNREAD = 'Messenger/REPLACE_UNREAD'

import { storage } from 'components'

function addUser(userKey, userOptions) {
  return dispatch => {
    dispatch({
      type: ADD_USER,
      userKey,
      userOptions,
    })
  }
}

function addMessage(idb, userKey, data) {
  return dispatch => new Promise((resolve, reject) => {
    const tx = idb.transaction('messages', 'readwrite')
    const store = tx.objectStore('messages')
    store.put({ userKey, ...data })
    
    tx.oncomplete = () => {
      resolve()
    }
  })
  
  /*
  return dispatch => {
    dispatch({
      type: ADD_MESSAGE,
      userKey,
      data,
    })
  }
  */
}

function setLastBlock(lastBlock) {
  return dispatch => {
    dispatch({
      type: SET_LAST_BLOCK,
      lastBlock,
    })
  }
}

function setUnread(userKey, unread) {
  return dispatch => {
    dispatch({
      type: SET_UNREAD,
      userKey,
      unread,
    })
  }
}

function replaceUsers(data) {
  return dispatch => {
    dispatch({
      type: REPLACE_USERS,
      data,
    })
  }
}

function replaceUnread(data) {
  return dispatch => {
    dispatch({
      type: REPLACE_UNREAD,
      data,
    })
  }
}

export default {
  addUser,
  addMessage,
  setLastBlock,
  setUnread,
  replaceUsers,
  replaceUnread,
}
