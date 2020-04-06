'use strict'

const { PeerRPCClient }  = require('grenache-nodejs-ws')
const Link = require('grenache-nodejs-link')

const link = new Link({
  grape: 'http://127.0.0.1:30001',
  requestTimeout: 10000
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

const orders = [
  {
    id: 1,
    price: 100,
    quantity: 2,
    side: 'BUY',
    baseAsset: 'BTC',
    quoteAsset: 'XRP',
  },
  {
    id: 2,
    price: 100,
    quantity: 2,
    side: 'SELL',
    baseAsset: 'BTC',
    quoteAsset: 'XRP',
  },
]

orders.forEach((order, i) => {
  peer.request('orderbook', order, { timeout: 100000 }, (err, result) => {
    if (err) throw err
    console.log(`
      -----------------------------------
      Order: ${JSON.stringify(order)}\n
      Trades: ${JSON.stringify(result)}\n
      -----------------------------------
    `)
  })
})

