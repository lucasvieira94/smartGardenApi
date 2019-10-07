const AWS = require('aws-sdk')

module.exports.deviceTopicListener = (event, context, callback) => {
  return new Promise((resolve, reject) => {
    console.log(event)
    resolve()
  })
}
