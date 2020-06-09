const transfersRouter = require('express').Router()
const Transfer = require('../models/transfer')

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

module.exports = transfersRouter