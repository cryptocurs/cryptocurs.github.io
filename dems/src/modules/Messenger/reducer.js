import R from 'ramda'

import {
  ADD_USER,
  ADD_MESSAGE,
  SET_LAST_BLOCK,
  SET_UNREAD,
} from './actions'

const initialState = {
  users: {},
  messages: {},
  unread: {},
};

export default function(state = initialState, action) {
  const actions = {
    [ADD_USER]: () => ({
      ...state,
      users: {
        ...state.users,
        [action.userKey]: action.userOptions,
      },
    }),
    [ADD_MESSAGE]: () => ({
      ...state,
      messages: {
        ...state.messages,
        [action.userKey]: [
          ...((state.messages || {})[action.userKey] || []),
          action.data,
        ],
      },
    }),
    [SET_LAST_BLOCK]: () => ({
      ...state,
      lastBlock: action.lastBlock,
    }),
    [SET_UNREAD]: () => ({
      ...state,
      unread: {
        ...state.unread,
        [action.userKey]: action.unread,
      },
    }),
  }
  return actions[action.type] && actions[action.type]() || state
}
