exports.promisify = function (fn) {
  return new Promise((resolve, reject) => {
    fn((error) => { if (error) { reject(error) } else { resolve() } })
  })
}
