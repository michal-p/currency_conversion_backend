require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const Transfer = require('./models/transfer')
const currencyServices = require('./services/currencies').default
const cors = require('cors')
const morgan = require('morgan')

app.use(express.static('build'))
app.use(bodyParser.json())
app.use(cors())
morgan.token('body', (req) => {
  return JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

let currenciesList = {}
let currenciesLatest = {}

const convert = (amount, ratesFrom, ratesTo) => {
  const amountTo = Math.abs(amount) * ratesTo / ratesFrom
  return Number(amountTo)
}

app.get('/api/transfers', (request, response, next) => {
  console.log('server transfers')
  Transfer.find({})
    .then(transfers => {
      response.json(transfers.map(tran => tran.toJSON()))
    }).catch(error => {
      console.log('transfers - getTransfers data service error: ', error)
      next(error)
    })
})

app.get('/api/currencies', (request, response, next) => {
  currencyServices
    .getCurrencies()
    .then(currencies => {
      currenciesList = currencies
      response.json(currenciesList)
    }).catch(error => next(error))
})

app.get('/api/latest', (request, response, next) => {
  currencyServices
    .getLatest()
    .then(currencies => {
      currenciesLatest = currencies
      response.json(currenciesLatest)
    }).catch(error => next(error))
})

app.get('/api/statistics', (request, response, next) => {
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

app.post('/api/convert', (request, response, next) => {
  let body = request.body
  const transfer = new Transfer({
    currencyFrom: body.fromCurrency,
    amountFrom: Number(Math.abs(body.fromAmount)),
    currencyTo: body.toCurrency
  })

  currencyServices
    .getLatest()
    .then(latests => {
      currenciesLatest = latests
      transfer.amountTo = convert(
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

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})