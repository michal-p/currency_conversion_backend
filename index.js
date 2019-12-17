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
  return Number(amountTo.toFixed(2))
}

app.get('/api/currencies', (request, response) => {
  console.log('server currencies')
  currencyServices
    .getCurrencies()
    .then(currencies => {
      currenciesList = currencies
      console.log('tot: ', currenciesList)
      response.json(currenciesList) //The toJSON method we defined transforms object into a string just to be safe.
    }).catch(error => {
      console.log('currencies - getCurrencies data service error: ', error)
    })

})

app.get('/api/latest', (request, response) => {
  console.log('server latest')
  currencyServices
    .getLatest()
    .then(currencies => {
      currenciesLatest = currencies
      console.log('tot: ', currenciesLatest)
      response.json(currenciesLatest) //The toJSON method we defined transforms object into a string just to be safe.
    }).catch(error => {
      console.log('latest - getLatest data service error: ', error)
    })

})

app.post('/api/convert', (request, response, next) => {
  console.log('server convert')
  let body = request.body
  console.log('body: ', body)
  const transfer = new Transfer({
    currencyFrom: body.fromCurrency,
    amountFrom: Number(Number(body.fromAmount).toFixed(2)),
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
        (transfer.amountFrom / currenciesLatest.rates[transfer.currencyFrom]).toFixed(2)
      )
      transfer.date = new Date()
      console.log('transfer: ', transfer)
      transfer.save()
        .then(newTransfer => newTransfer.toJSON())
        .then(newTransferFormatted => response.json(newTransferFormatted))
        .catch(error => next(error))
    })
    .catch(error => {
      console.log('convert - getLatest service error: ', error)
    })

})

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})