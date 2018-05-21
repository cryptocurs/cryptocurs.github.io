module.exports = {
  "app": {
    "localStoragePrefix": "rinkeby_"
  },
  "network": {
    "id": "4",
    "explorerTx": "https://rinkeby.etherscan.io/tx/",
    "explorerAddress": "https://rinkeby.etherscan.io/address/"
  },
  "contract": {
    "createdAtBlock": 2318009,
    "address": "0x473f5B10748DaA973D5Db0A132d775B7D23a869a",
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