const transfersRouter = require('express').Router()
const Transfer = require('../models/transfer')
const currencyServices = require('../services/currencies')
const helper = require('../utils/helper')

transfersRouter.get('/', (request, response, next) => {
  console.log('server transfers')
  Transfer.find({})
    .then(transfers => {
      response.json(transfers.map(tran => tran.toJSON()))
    }).catch(error => {
      console.log('transfers - getTransfers data service error: ', error)
      next(error)
    })
})

transfersRouter.get('/statistics', (request, response, next) => {
  let obj = {}
  Transfer.countDocuments()
    .then(result => {
      obj.amountRequests = result
      Transfer.aggregate(
        [{ $group: {
          _id: null,
          total: { $sum: '$convertedInDollars' } } }]
      ).then(result => {
        obj.amountConvertedInUSD = Number(result[0].total.toFixed(2))
        Transfer.aggregate(
          [{ $group:{
            _id: '$currencyTo',
            count: { $sum: 1 }
          } },
          { $sort:{
            'count': -1
          } },
          { $limit: 1 }]
        ).then(result => {
          obj.popular = result[0]._id
          response.json(obj)
        }).catch(error => next(error))
      }).catch(error => next(error))
    }).catch(error => next(error))
})

transfersRouter.post('/convert', (request, response, next) => {
  let body = request.body
  const transfer = new Transfer({
    currencyFrom: body.fromCurrency,
    amountFrom: Number(Math.abs(body.fromAmount)),
    currencyTo: body.toCurrency
  })

  currencyServices
    .getLatest()
    .then(currenciesLatest => {
      transfer.amountTo = helper.convert(
        transfer.amountFrom,
        currenciesLatest.rates[transfer.currencyFrom],
        currenciesLatest.rates[transfer.currencyTo]
      )
      transfer.convertedInDollars = Number(transfer.amountFrom / currenciesLatest.rates[transfer.currencyFrom])
      transfer.date = new Date()
      transfer.save()
        .then(newTransfer => newTransfer.toJSON())
        .then(newTransferFormatted => response.json(newTransferFormatted))
        .catch(error => next(error))
    }).catch(error => next(error))
})

module.exports = transfersRouter