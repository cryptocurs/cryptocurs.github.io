import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { AutoSizer } from 'react-virtualized'

import {storage} from 'components'
import {ErrorContainer, Header, LoginForm, Wallet} from 'modules'

import 'node_modules/bootstrap/dist/css/bootstrap.min.css'
import 'node_modules/font-awesome/css/font-awesome.css'
import 'assets/css/bootstrap-solar.css'
import 'assets/css/bootstrap-all.css'
import 'assets/css/common.css'
 
class App extends Component {

  constructor() {
    super()
    storage.get().set({
      chainId: 1,
    })
  }
  
  componentDidMount() {
    storage.on('update', () => this.forceUpdate())
  }
  
  render() {
    const { address, apiError } = storage.get()
    
    return (
      <AutoSizer>
        {({ height, width }) => (
          <div style={{ height, width }}>
            {
              apiError && <ErrorContainer height={height} width={width} error={apiError} /> ||
              address && <Wallet height={height} width={width} /> ||
              <LoginForm />
            }
          </div>
        )}
      </AutoSizer>
    )
  }
}
 
ReactDOM.render( <App />, document.getElementById('app') )
