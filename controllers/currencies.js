const currenciesRouter = require('express').Router()
const currencyServices = require('../services/currencies')

currenciesRouter.get('/', (request, response, next) => {
  currencyServices
    .getCurrencies()
    .then(currenciesList => {
      response.json(currenciesList)
    }).catch(error => next(error))
})

currenciesRouter.get('/latest', (request, response, next) => {
  currencyServices
    .getLatest()
    .then(currenciesLatest => {
      response.json(currenciesLatest)
    }).catch(error => next(error))
})

module.exports = currenciesRouter