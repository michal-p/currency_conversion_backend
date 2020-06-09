const config = require('../utils/config')
const axios = require('axios')
const baseUrl = 'https://openexchangerates.org/api/'
const apiID = config.API_KEY
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
    return response.data
  })
}

const getCurrencies = () => {
  const request = axios.get(createUrl(endPoints.currencies))
  return request.then(response => {
    return response.data
  })
}

module.exports = {
  getLatest, getCurrencies
}