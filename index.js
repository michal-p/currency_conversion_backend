require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
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
  return amountTo.toFixed(2)
}

app.get('/api/currencies', (request, response) => {
  console.log('server currencies')
  currencyServices
    .getCurrencies()
    .then(currencies => {
      currenciesList = currencies
      console.log('tot: ', currenciesList)
      response.json(currenciesList) //The toJSON method we defined transforms object into a string just to be safe.
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
    })

})

app.post('/api/convert', (request, response) => {
  console.log('server convert')
  let body = request.body
  console.log('body: ', body)
  const transfer = {
    amountFrom: body.fromAmount,
    currencyFrom: body.fromCurrency,
    currencyTo: body.toCurrency
  }

  currencyServices
    .getLatest()
    .then(latests => {
      console.log('latests: ', latests)
      currenciesLatest = latests
      transfer.ratesFrom = currenciesLatest.rates[transfer.currencyFrom]
      transfer.ratesTo = currenciesLatest.rates[transfer.currencyTo]
      transfer.amountTo = convert(transfer.amountFrom, transfer.ratesFrom, transfer.ratesTo)
      console.log('transfer: ', transfer)
      response.json(transfer) //The toJSON method we defined transforms object into a string just to be safe.
    })

})

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})