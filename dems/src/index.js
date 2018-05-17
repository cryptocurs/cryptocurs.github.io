import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { AutoSizer } from 'react-virtualized'
import moment from 'moment'
import crypto from 'crypto'

import reducer from './modules/Messenger/reducer'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'

import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'

const persistMiddleware = ({ getState, dispatch }) => next => action => {
  const result = next(action)
  localStorage.setItem('state', JSON.stringify(getState()))
  return result
}

const middlewares = [ thunkMiddleware, persistMiddleware ]
if (process.env.NODE_ENV === 'development') {
  middlewares.push(createLogger({}))
}
const createStoreWithMiddleware = applyMiddleware(...middlewares)(createStore)
const state = localStorage.getItem('state')
const store = createStoreWithMiddleware(
  reducer,
  state ? JSON.parse(state) : {}
)

import {storage, ls} from 'components'
import {Header, LoginForm, Messenger} from 'modules'

import config from './config'

import 'node_modules/bootstrap/dist/css/bootstrap.min.css'
import 'node_modules/font-awesome/css/font-awesome.css'

import 'assets/css/main.css'
 
class App extends Component {

  constructor() {
    super()
    this.state = {
      selected: 1,
    }
    
    // ls.writeIfEmpty('accounts', [])
    // ls.writeRawIfEmpty('currentAccount', 0)
    // ls.writeRawIfEmpty('gasPrice', 35)
  }
  
  componentDidMount() {
    storage.on('update', () => this.forceUpdate())
    storage.get().set({ config })
  }
  
  getComponent(selected, width, height) {
    switch (selected) {
      case 1: return <Messenger width={width} height={height} />
    }
  }
  
  render() {
    const {address} = storage.get()
    const {selected} = this.state
    
    return (
      <Provider store={store}>
        <AutoSizer>
          {({ height, width }) => (
            <div style={{height, width}}>
              <Header onSelect={(selected) => this.setState({selected})} />
              {address && this.getComponent(selected, width, height) || <LoginForm />}
            </div>
          )}
        </AutoSizer>
      </Provider>
    )
  }
}
 
ReactDOM.render( <App />, document.getElementById('app') )
