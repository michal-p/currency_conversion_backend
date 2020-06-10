const convert = (amount, ratesFrom, ratesTo) => {
  const amountTo = Math.abs(amount) * ratesTo / ratesFrom
  return Number(amountTo)
}

module.exports = {
  convert
}