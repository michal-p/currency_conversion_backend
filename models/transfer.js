const config = require('../utils/config')
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false)

const url = config.MONGODB_URI

console.log('connecting to', url)

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(console.log('connected to MongoDB'))
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

const transferSchema = new mongoose.Schema({
  currencyFrom: {
    type: String,
    minlength: 3,
    maxlength: 3,
    required: [true, 'CurrencyFrom name has to be 3 characters length required']
  },
  amountFrom: {
    type: Number,
    validate: {
      validator: function (v) {
        return v > 0
      },
      message: props => `${props.value} amountFrom has to bigger than zero`
    },
    required: true
  },
  currencyTo: {
    type: String,
    minlength: 3,
    maxlength: 3,
    required: [true, 'CurrencyTo name has to be 3 characters length required']
  },
  amountTo: {
    type: Number,
    validate: {
      validator: function (v) {
        return v > 0
      },
      message: props => `${props.value} amountTo has to bigger than zero`
    },
    required: true
  },
  convertedInDollars: {
    type: Number,
    validate: {
      validator: function (v) {
        return v > 0
      },
      message: props => `${props.value} amountTo has to bigger than zero`
    },
    required: true
  },
  date: Date
})

transferSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Transfer', transferSchema)