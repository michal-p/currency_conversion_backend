require('dotenv').config()
let API_KEY = process.env.API_KEY
let PORT = process.env.PORT
let MONGODB_URI = process.env.MONGODB_URI

if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  MONGODB_URI = process.env.TEST_MONGODB_URI
}

module.exports = {
  MONGODB_URI,
  PORT,
  API_KEY
}