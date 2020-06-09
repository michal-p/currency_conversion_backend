const config = require('./utils/config')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const transfersRouter = require('./controllers/transfers')
const currenciesRouter = require('./controllers/currencies')
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