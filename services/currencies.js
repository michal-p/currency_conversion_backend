const axios = require('axios')
const baseUrl = 'https://openexchangerates.org/api/'
const apiID = process.env.API_KEY
const endPoints = {
  latest: 'latest.json',
  currencies: 'currencies.json'
}
const createUrl = (action) => {
  return `${baseUrl}/${action}/?app_id=${apiID}`
}

const getLatest = () => {
  const request = axios.get(createUrl(endPoints.latest))
  return request.then(response => {
    console.log('getLatest promise fulfilled')
    return response.data
  })
}

const getCurrencies = () => {
  const request = axios.get(createUrl(endPoints.currencies))
  return request.then(response => {
    console.log('getCurrencies promise fulfilled')
    return response.data
  })
}

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.default = { getLatest, getCurrencies }