const assert = require('assert')
const OrderBook = require('./orderbook')

describe('order book', () => {
  describe('match', () => {
    it('should initiate fifo list if one does not exist for given order', () => {
      const orderbook = new OrderBook()

      const order = {
        id: 1,
        side: 'BUY',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        price: 100,
        quantity: 2,
      }

      const trades = orderbook.match(order)
      assert.ok(orderbook.pairs['BTCUSD'])
      assert.deepStrictEqual(orderbook.pairs['BTCUSD']['BUY'][100][0], order)
      assert.equal(trades.length, 0)
    });

    it('should successfully add multiple orders under same price poit', () => {
      const orderbook = new OrderBook()

      const orderOne = {
        id: 1,
        side: 'BUY',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        price: 100,
        quantity: 2,
      }

      const orderTwo = {
        id: 2,
        side: 'BUY',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        price: 100,
        quantity: 3,
      }

      const tradesOne = orderbook.match(orderOne)
      const tradesTwo = orderbook.match(orderTwo)

      assert.ok(orderbook.pairs['BTCUSD'])
      assert.equal(orderbook.pairs['BTCUSD']['BUY'][100].length, 2)
      assert.deepStrictEqual(orderbook.pairs['BTCUSD']['BUY'][100][0], orderOne)
      assert.deepStrictEqual(orderbook.pairs['BTCUSD']['BUY'][100][1], orderTwo)

      assert.equal(tradesOne.length, 0)
      assert.equal(tradesTwo.length, 0)
    });

    it('should successfully add multiple orders under different price poits', () => {
      const orderbook = new OrderBook()

      const orderOne = {
        id: 1,
        side: 'BUY',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        price: 100,
        quantity: 2,
      }

      const orderTwo = {
        id: 2,
        side: 'BUY',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        price: 500,
        quantity: 3,
      }

      const tradesOne = orderbook.match(orderOne)
      const tradesTwo = orderbook.match(orderTwo)

      assert.ok(orderbook.pairs['BTCUSD'])
      assert.equal(orderbook.pairs['BTCUSD']['BUY'][100].length, 1)
      assert.deepStrictEqual(orderbook.pairs['BTCUSD']['BUY'][100][0], orderOne)

      assert.equal(orderbook.pairs['BTCUSD']['BUY'][500].length, 1)
      assert.deepStrictEqual(orderbook.pairs['BTCUSD']['BUY'][500][0], orderTwo)

      assert.equal(tradesOne.length, 0)
      assert.equal(tradesTwo.length, 0)
    });

    it('should successfully add multiple orders under different pair names and price poits', () => {
      const orderbook = new OrderBook()

      const orderOne = {
        id: 1,
        side: 'BUY',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        price: 100,
        quantity: 2,
      }

      const orderTwo = {
        id: 2,
        side: 'BUY',
        baseAsset: 'XRP',
        quoteAsset: 'BTC',
        price: 500,
        quantity: 3,
      }

      const tradesOne = orderbook.match(orderOne)
      const tradesTwo = orderbook.match(orderTwo)

      assert.ok(orderbook.pairs['BTCUSD'])
      assert.equal(orderbook.pairs['BTCUSD']['BUY'][100].length, 1)
      assert.deepStrictEqual(orderbook.pairs['BTCUSD']['BUY'][100][0], orderOne)

      assert.ok(orderbook.pairs['XRPBTC'])
      assert.equal(orderbook.pairs['XRPBTC']['BUY'][500].length, 1)
      assert.deepStrictEqual(orderbook.pairs['XRPBTC']['BUY'][500][0], orderTwo)

      assert.equal(tradesOne.length, 0)
      assert.equal(tradesTwo.length, 0)
    });

    it('should fully match 2 orders', () => {
      const orderbook = new OrderBook()

      const orderOne = {
        id: 1,
        side: 'BUY',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        price: 100,
        quantity: 2,
      }

      const orderTwo = {
        id: 2,
        side: 'SELL',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        price: 100,
        quantity: 2,
      }

      const tradesOne = orderbook.match(orderOne)
      const tradesTwo = orderbook.match(orderTwo)

      assert.ok(orderbook.pairs['BTCUSD'])
      assert.equal(orderbook.pairs['BTCUSD']['BUY'][100].length, 0)

      assert.equal(tradesOne.length, 0)
      assert.equal(tradesTwo.length, 1)

      assert.deepStrictEqual(tradesTwo[0], {
        baseAsset: 'BTC',
        destinationOrderId: 1,
        price: 100,
        quantity: 2,
        quoteAsset: 'USD',
        sourceOrderId: 2
      })
    });

    it('should partially match 2 orders', () => {
      const orderbook = new OrderBook()

      const orderOne = {
        id: 1,
        side: 'BUY',
        baseAsset: 'USD',
        quoteAsset: 'BTC',
        price: 200,
        quantity: 1,
      }

      const orderTwo = {
        id: 2,
        side: 'SELL',
        baseAsset: 'USD',
        quoteAsset: 'BTC',
        price: 100,
        quantity: 2,
      }

      const tradesOne = orderbook.match(orderOne)
      const tradesTwo = orderbook.match(orderTwo)

      assert.ok(orderbook.pairs['USDBTC'])
      assert.equal(orderbook.pairs['USDBTC']['BUY'][200].length, 0)
      assert.equal(orderbook.pairs['USDBTC']['SELL'][100].length, 1)

      assert.deepStrictEqual(orderbook.pairs['USDBTC']['SELL'][100][0], {
        ...orderTwo,
        quantity: 1,
      })

      assert.equal(tradesOne.length, 0)
      assert.equal(tradesTwo.length, 1)
    });

    it('should not match 2 orders when asking price is out of range', () => {
      const orderbook = new OrderBook()

      const orderOne = {
        id: 1,
        side: 'BUY',
        baseAsset: 'USD',
        quoteAsset: 'BTC',
        price: 200,
        quantity: 1,
      }

      const orderTwo = {
        id: 2,
        side: 'SELL',
        baseAsset: 'USD',
        quoteAsset: 'BTC',
        price: 100000,
        quantity: 2,
      }

      const tradesOne = orderbook.match(orderOne)
      const tradesTwo = orderbook.match(orderTwo)

      assert.ok(orderbook.pairs['USDBTC'])
      assert.equal(orderbook.pairs['USDBTC']['BUY'][200].length, 1)
      assert.equal(orderbook.pairs['USDBTC']['SELL'][100000].length, 1)

      assert.deepStrictEqual(orderbook.pairs['USDBTC']['BUY'][200][0], orderOne)
      assert.deepStrictEqual(orderbook.pairs['USDBTC']['SELL'][100000][0], orderTwo)

      assert.equal(tradesOne.length, 0)
      assert.equal(tradesTwo.length, 0)
    });

    it('should match 2 buy with 1 sell order', () => {
      const orderbook = new OrderBook()

      const orderOne = {
        id: 1,
        side: 'BUY',
        baseAsset: 'USD',
        quoteAsset: 'BTC',
        price: 200,
        quantity: 1,
      }

      const orderTwo = {
        id: 2,
        side: 'BUY',
        baseAsset: 'USD',
        quoteAsset: 'BTC',
        price: 300,
        quantity: 1,
      }

      const orderThree = {
        id: 3,
        side: 'SELL',
        baseAsset: 'USD',
        quoteAsset: 'BTC',
        price: 10,
        quantity: 5,
      }

      const tradesOne = orderbook.match(orderOne)
      const tradesTwo = orderbook.match(orderTwo)
      const tradesThree = orderbook.match(orderThree)

      assert.ok(orderbook.pairs['USDBTC'])
      assert.equal(orderbook.pairs['USDBTC']['BUY'][200].length, 0)
      assert.equal(orderbook.pairs['USDBTC']['BUY'][300].length, 0)
      assert.equal(orderbook.pairs['USDBTC']['SELL'][10].length, 1)

      assert.deepStrictEqual(orderbook.pairs['USDBTC']['SELL'][10][0], {
        ...orderThree,
        quantity: 3,
      })

      assert.equal(tradesOne.length, 0)
      assert.equal(tradesTwo.length, 0)
      assert.equal(tradesThree.length, 2)
    });
  });
});

