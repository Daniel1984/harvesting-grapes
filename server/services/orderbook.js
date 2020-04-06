'use strict'

class OrderBook {
  constructor() {
    /*
     * pairs = {
     *  [`${order.baseAsset}${order.quoteAsset}`]: {
     *    [order.side]: {
     *      [order.price]: [orders fifo queue for given asset pair/side/price],
     *    },
     *  }
     * }
     */
    this.pairs = {}
  }

  /*
   * order = {
   *  id: int/string,
   *  side: enum['BUY', 'SELL'],
   *  price: number,
   *  quantity: number,
   *  baseAsset: string,
   *  quoteAsset: string,
   * }
   */
  match(order) {
    let trades = []

    if (order.side === 'BUY') {
      trades = this.matchBuyWithSellOrders(order)
    }

    if (order.side === 'SELL') {
      trades = this.matchSellWithBuyOrders(order)
    }

    if (order.quantity > 0) {
      this.parkOrder(order)
    }

    return trades
  }

  matchBuyWithSellOrders(buyOrder) {
    const { baseAsset, quoteAsset } = buyOrder
    const pair = `${baseAsset}${quoteAsset}`
    const favorableSellPrices = this.getFavorableSellPrices(pair)

    const transactions = []

    for (let i = 0; i < favorableSellPrices.length; i++) {
      if (favorableSellPrices[i] > buyOrder.price) continue
      if (buyOrder.quantity === 0) break

      const sellOrdersToRemove = {}

      this.pairs[pair]['SELL'][favorableSellPrices[i]].forEach((sellOrder, i) => {
        const remainderQuantity = sellOrder.quantity - buyOrder.quantity
        const transaction = {
          sourceOrderId: sellOrder.id,
          destinationOrderId: buyOrder.id,
          baseAsset,
          quoteAsset,
        }

        if (remainderQuantity < 0) {
          // sellOrder filled
          transactions.push({
            price: sellOrder.price,
            quantity: sellOrder.quantity,
            ...transaction
          })
          sellOrdersToRemove[sellOrder.price] = i
          buyOrder.quantity = Math.abs(remainderQuantity)
          sellOrder.quantity = 0
        } else if (remainderQuantity > 0) {
          // buyOrder filled
          transactions.push({
            price: sellOrder.price,
            quantity: buyOrder.quantity,
            ...transaction
          })
          sellOrder.quantity = remainderQuantity
          buyOrder.quantity = 0
        } else {
          // both orders filled
          transactions.push({
            price: sellOrder.price,
            quantity: buyOrder.quantity,
            ...transaction
          })
          sellOrdersToRemove[sellOrder.price] = i
          buyOrder.quantity = 0
          sellOrder.quantity = 0
        }
      })

      Object.keys(sellOrdersToRemove).forEach(price => {
        this.pairs[pair]['SELL'][price].splice(sellOrdersToRemove[price], 1)
      })
    }

    return transactions
  }

  matchSellWithBuyOrders(sellOrder) {
    const { baseAsset, quoteAsset } = sellOrder
    const pair = `${baseAsset}${quoteAsset}`
    const favorableBuyPrices = this.getFavorableBuyPrices(pair)

    const transactions = []

    for (let i = 0; i < favorableBuyPrices.length; i++) {
      if (favorableBuyPrices[i] < sellOrder.price) continue
      if (sellOrder.quantity === 0) break

      const buyOrdersToRemove = {}

      this.pairs[pair]['BUY'][favorableBuyPrices[i]].forEach((buyOrder, i) => {
        const remainderQuantity = sellOrder.quantity - buyOrder.quantity
        const transaction = {
          sourceOrderId: sellOrder.id,
          destinationOrderId: buyOrder.id,
          baseAsset,
          quoteAsset,
        }

        if (remainderQuantity < 0) {
          // sellOrder filled
          transactions.push({
            price: buyOrder.price,
            quantity: sellOrder.quantity,
            ...transaction
          })
          buyOrder.quantity = Math.abs(remainderQuantity)
          sellOrder.quantity = 0
        } else if (remainderQuantity > 0) {
          // buyOrder filled
          transactions.push({
            price: buyOrder.price,
            quantity: buyOrder.quantity,
            ...transaction
          })
          buyOrder.quantity = 0
          buyOrdersToRemove[buyOrder.price] = i
          sellOrder.quantity = remainderQuantity
        } else {
          // both orders filled
          transactions.push({
            price: buyOrder.price,
            quantity: sellOrder.quantity,
            ...transaction
          })
          buyOrder.quantity = 0
          sellOrder.quantity = 0
          buyOrdersToRemove[buyOrder.price] = i
        }
      })

      Object.keys(buyOrdersToRemove).forEach(price => {
        this.pairs[pair]['BUY'][price].splice(buyOrdersToRemove[price], 1)
      })
    }

    return transactions
  }

  parkOrder(order) {
    const { side, price, baseAsset, quoteAsset } = order
    const pair = `${baseAsset}${quoteAsset}`

    if (!(pair in this.pairs)) {
      this.pairs[pair] = {}
    }

    if (!(side in this.pairs[pair])) {
      this.pairs[pair][side] = {}
    }

    if (!(price in this.pairs[pair][side])) {
      this.pairs[pair][side][price] = []
    }

    this.pairs[pair][side][price].push(order)
  }

  getFavorableBuyPrices(pair) {
    return this.getPricesFor({ pair, side: 'BUY' }).sort((a, b) => b - a)
  }

  getFavorableSellPrices(pair) {
    return this.getPricesFor({ pair, side: 'SELL' }).sort((a, b) => b - a)
  }

  getPricesFor({ pair, side }) {
    if (this.pairs[pair] && this.pairs[pair][side]) {
      return Object.keys(this.pairs[pair][side])
    }

    return []
  }
}

module.exports = OrderBook;
