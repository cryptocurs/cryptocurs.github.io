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
    const contractAddress = '0x64488C9ffee6a23620F80fe4E0Dc85bE17B4c613' // main
    // const contractAddress = '0x2deF0d228A35D52D1C218586Eb02792cB6716199' // rinkeby
    storage.get().set({
      chainId: 1, // main
      // chainId: 3, // ropsten
      // chainId: 4, // rinkeby
      
      apiUrl: 'https://api.etherscan.io/api', // main
      // apiUrl: 'https://api-ropsten.etherscan.io/api', // ropsten
      // apiUrl: 'https://rinkeby.etherscan.io/api', // rinkeby
      
      explorerUrl: 'https://etherscan.io/', // main
      // explorerUrl: 'https://ropsten.etherscan.io/', // ropsten
      
      tokenName: 'MTWE',
      contractAddress,
      contractAddressLower: contractAddress.toLowerCase(),
      contractK: '1000000000000000000',
      
      eventHashes: {
        PlaceBuy: '0x374adb591d8f5873d6fcbcfe8dc104e41a3dbb653288236af9a3ad210da48462',
        PlaceSell: '0xdaf2f29fb859e29a8669abdfd1cb93729853bcbbeb611af738218c70849696ac',
        FillOrder: '0xaa2d5c051098b55cf71a58aeae7141cdc811975799a3d6fc8464f091a14c40d2',
        CancelOrder: '0x935c9ad2f1fda9d7eae0d2a512f1521cb7190ee06165414e722366a65975fb6b',
      },
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