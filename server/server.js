'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-ws')
const Link = require('grenache-nodejs-link')
const OrderBook = require('./services/orderbook');

const orderbook = new OrderBook()

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})

link.start()

const peer = new PeerRPCServer(link, {})
peer.init()


const port = 1024 + Math.floor(Math.random() * 1000)
const service = peer.transport('server')
service.listen(port)

setInterval(() => {
  link.announce('orderbook', service.port, {})
}, 1000)

service.on('request', (rid, key, payload, handler) => {
  console.log(`
    -----------------------------------
    rid: ${rid} \n
    key: ${key} \n
    payload: ${JSON.stringify(payload)} \n
    -----------------------------------
  `);

  const trades = orderbook.match(payload)
  handler.reply(null, trades)
})
