const AWS = require('aws-sdk')
const awsIot = require('aws-iot-device-sdk')
const { MeasureModel } = require('../models')

module.exports.deviceTopicListener = (event, context, callback) => {
  return new Promise((resolve, reject) => {
    console.log(event)
    let { state } = event
    console.log(state)

    let measure = new MeasureModel({
      sensor: "soilHumidity",
      value: state.reported.moisture,
      plantId: 1
    })

    console.log(measure)

    await measure.save().then(() => {
      resolve("Measure saved!")
    }).catch(error => {
      reject(error)
    })
  })
}
