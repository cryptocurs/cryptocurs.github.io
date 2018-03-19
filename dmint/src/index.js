import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { AutoSizer } from 'react-virtualized'

import {storage} from 'components'
import {ErrorContainer, Header, LoginForm, Wallet} from 'modules'

import 'node_modules/bootstrap/dist/css/bootstrap.min.css'
import 'node_modules/font-awesome/css/font-awesome.css'
 
class App extends Component {

  constructor() {
    super()
    const contractAddress = '0x51c6a6Ef1352578Ff01B078313E6779B88BDcb1E'
    storage.get().set({
      chainId: 1,
      tokenName: 'DMINT',
      contractAddress,
      contractAddressLower: contractAddress.toLowerCase(),
      contractK: '1000000000000000000',
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
          <div style={{height, width}}>
            <Header />
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