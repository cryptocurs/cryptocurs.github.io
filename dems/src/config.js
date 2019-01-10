module.exports = {
  "app": {
    "localStoragePrefix": "mainnet_",
    "localStorageLimit": 1000000,
  },
  "network": {
    "id": "1",
    "explorerTx": "https://etherscan.io/tx/",
    "explorerAddress": "https://etherscan.io/address/"
  },
  "contract": {
    "createdAtBlock": 5607374,
    // "createdAtBlock": 2293455,
    "address": "0xA4989f68324f3A152e05bD9B11098425b927652b",
    // "address": "0xa6FD097fCf21CF40E8186d09AB0D12b60D4C9a29",
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "iv",
            "type": "bytes"
          },
          {
            "name": "epk",
            "type": "bytes"
          },
          {
            "name": "ct",
            "type": "bytes"
          },
          {
            "name": "mac",
            "type": "bytes"
          }
        ],
        "name": "sendMessage",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "iv",
            "type": "bytes"
          },
          {
            "indexed": false,
            "name": "epk",
            "type": "bytes"
          },
          {
            "indexed": false,
            "name": "ct",
            "type": "bytes"
          },
          {
            "indexed": false,
            "name": "mac",
            "type": "bytes"
          },
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          }
        ],
        "name": "SendMessage",
        "type": "event"
      }
    ]
  }
}