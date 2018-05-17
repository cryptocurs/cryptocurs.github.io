export const ADD_USER = 'Messenger/ADD_USER'
export const ADD_MESSAGE = 'Messenger/ADD_MESSAGE'
export const SET_LAST_BLOCK = 'Messenger/SET_LAST_BLOCK'
export const SET_UNREAD = 'Messenger/SET_UNREAD'

function addUser(userKey, userOptions) {
  return dispatch => {
    dispatch({
      type: ADD_USER,
      userKey,
      userOptions,
    })
  }
}

function addMessage(userKey, data) {
  return dispatch => {
    dispatch({
      type: ADD_MESSAGE,
      userKey,
      data,
    })
  }
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

export default {
  addUser,
  addMessage,
  setLastBlock,
  setUnread,
}
