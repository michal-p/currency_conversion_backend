// const config = require('./utils/config')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const transfersRouter = require('./controllers/transfers')
const currenciesRouter = require('./controllers/currencies')
const middleware = require('./utils/middleware')
const cors = require('cors')
const morgan = require('morgan')

app.use(express.static('build'))
app.use(bodyParser.json())
app.use(cors())
morgan.token('body', (req) => {
  return JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.use('/api/currencies', currenciesRouter)
app.use('/api/transfers', transfersRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app