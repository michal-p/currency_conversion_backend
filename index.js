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

let currenciesData = {}

app.get('/api/currencies', (request, response) => {
  console.log('server bub')
  currencyServices
    .getCurrencies()
    .then(currencies => {
      currenciesData = currencies
      console.log('tot: ', currenciesData)
      response.json(currenciesData) //The toJSON method we defined transforms object into a string just to be safe.
    })

})

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})