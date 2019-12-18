require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const Transfer = require('./models/transfer')
const currencyServices = require('./services/currencies').default
const cors = require('cors')
const morgan = require('morgan')

app.use(express.static('build')) //Frontend files
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
  return Number(amountTo.toFixed(6))
}

app.get('/api/currencies', (request, response, next) => {
  console.log('server currencies')
  currencyServices
    .getCurrencies()
    .then(currencies => {
      currenciesList = currencies
      // console.log('tot: ', currenciesList)
      response.json(currenciesList) //The toJSON method we defined transforms object into a string just to be safe.
    }).catch(error => {
      console.log('currencies - getCurrencies data service error: ', error)
      next(error)
    })
})

app.get('/api/latest', (request, response, next) => {
  console.log('server latest')
  currencyServices
    .getLatest()
    .then(currencies => {
      currenciesLatest = currencies
      console.log('tot: ', currenciesLatest)
      response.json(currenciesLatest) //The toJSON method we defined transforms object into a string just to be safe.
    }).catch(error => {
      console.log('latest - getLatest data service error: ', error)
      next(error)
    })
})

app.get('/api/statistics', (request, response, next) => {
  console.log('server statistics')
  let obj = {}
  Transfer.countDocuments()
    .then(result => {
      console.log('Transfer count() result: ', result)
      obj.amountRequests = result
      Transfer.aggregate(
        [{ $group: {
          _id: null,
          total: { $sum: '$convertedInDollars' } } }]
      ).then(result => {
        console.log('amountConvertedInUSD: ', result)
        obj.amountConvertedInUSD = result[0].total
      })
      Transfer.aggregate(
        [{ $group:{
          _id: '$currencyTo',
          // totalAmount: { $sum: '$convertedInDollars' },
          count: { $sum: 1 }
        } },
        { $sort:{
          'count': -1
        } },
        { $limit: 1 }]
      ).then(result => {
        obj.popular = result[0]._id
        console.log('Transfer aggregate result: ', result)
        response.json(obj)
      }).catch(error => next(error))
    })
    .catch(error => {
      console.log('statistics - getStatistics data service error: ', error)
      next(error)
    })
})

app.post('/api/convert', (request, response, next) => {
  console.log('server convert')
  let body = request.body
  console.log('body: ', body)
  const transfer = new Transfer({
    currencyFrom: body.fromCurrency,
    amountFrom: Number(Number(body.fromAmount).toFixed(6)),
    currencyTo: body.toCurrency
  })

  currencyServices
    .getLatest()
    .then(latests => {
      console.log('latests: ', latests)
      currenciesLatest = latests
      transfer.amountTo = convert(
        transfer.amountFrom,
        currenciesLatest.rates[transfer.currencyFrom],
        currenciesLatest.rates[transfer.currencyTo]
      )
      transfer.convertedInDollars = Number(
        (transfer.amountFrom / currenciesLatest.rates[transfer.currencyFrom]).toFixed(6)
      )
      transfer.date = new Date()
      transfer.save()
        .then(newTransfer => newTransfer.toJSON())
        .then(newTransferFormatted => {
          console.log('newTransfer from db: ', newTransferFormatted)
          response.json(newTransferFormatted)
        })
        .catch(error => next(error))
    })
    .catch(error => {
      console.log('convert - getLatest service error: ', error)
      next(error)
    })

})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error("Deafault custom error Handler: ", error.message)

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}
// default custom Express error handler
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})