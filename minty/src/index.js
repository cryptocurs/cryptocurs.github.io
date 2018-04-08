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
    const contractAddress = '0x9Fa148edD31e8afde3CC766A12131409D34382C0'
    storage.get().set({
      chainId: 1,
      tokenName: 'MINTY',
      contractAddress,
      contractAddressLower: contractAddress.toLowerCase(),
      contractK: '1000000000000000000',
    })
  }
  
  componentDidMount() {
    storage.on('update', () => this.forceUpdate())
    
    const metaBased = window.location.hash.replace('#', '')
    if (metaBased !== '') {
      const meta = Buffer.from(metaBased, 'base64').toString('ascii')
      const metaArr = meta.split('$')
      if (metaArr.length === 3) {
        if (metaArr[0] === 'PAY') {
          const [ cmd, paymentMetaTo, paymentMetaAmount ] = metaArr
          if (paymentMetaTo && paymentMetaTo !== '' && paymentMetaAmount && paymentMetaAmount !== '') {
            storage.get().set({ paymentMetaTo, paymentMetaAmount })
          }
        } else if (metaArr[0] === 'AUTH') {
          const [ cmd, authToken, authUrl ] = metaArr
          if (authToken && authToken !== '' && authUrl && authUrl !== '') {
            storage.get().set({ authToken, authUrl })
          }
        }
      }
      
      const newLocation = window.location.href.replace('#' + metaBased, '')
      // history.replaceState({}, '', newLocation)
    }
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