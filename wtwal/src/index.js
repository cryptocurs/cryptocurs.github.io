import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { AutoSizer } from 'react-virtualized'

import {storage} from 'components'
import {ErrorContainer, Header, LoginForm, Wallet, LoggingOut} from 'modules'

import 'node_modules/bootstrap/dist/css/bootstrap.min.css'
import 'node_modules/font-awesome/css/font-awesome.css'
 
class App extends Component {

  constructor() {
    super()
    const contractAddress = '0x142f09843aAe651C3bA61421595610Cb6C8aff66' // main
    // const contractAddress = '0x2deF0d228A35D52D1C218586Eb02792cB6716199' // rinkeby
    storage.get().set({
      chainId: 1, // main
      // chainId: 4, // rinkeby
      
      apiUrl: 'https://api.etherscan.io/api', // main
      // apiUrl: 'https://rinkeby.etherscan.io/api', // rinkeby
      
      tokenName: 'W4T',
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
    const { address, loggingOut, apiError } = storage.get()
    
    return (
      <AutoSizer>
        {({ height, width }) => (
          <div style={{height, width}}>
            <Header />
            {
              apiError && <ErrorContainer height={height} width={width} error={apiError} /> ||
              loggingOut && <LoggingOut /> ||
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