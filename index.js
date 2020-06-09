const config = require('./utils/config')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const transfersRouter = require('./controllers/transfers')
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

app.use('/api/transfers', transfersRouter)

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

const PORT = config.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${config.PORT}`)
})