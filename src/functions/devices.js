const AWS = require('aws-sdk')
const awsIot = require('aws-iot-device-sdk')
const { MeasureModel, DeviceModel, GardenModel } = require('../models')

module.exports.deviceTopicListener = (event, context, callback) => {
  return new Promise(async (resolve, reject) => {
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

module.exports.newDevice = (event, context, callback) => {
  return new Promise(async (resolve, reject) => {

    if (event.body)
      event = event.body
    else
      event = JSON.parse(event.body);

    let id = await DeviceModel.findAll().then(devices => {
      return (devices.length + 1)
    }).catch(error => {
      callback(null, { statusCode: 400, body: JSON.stringify({ message: "Failed to retrieve devices on database." }) })
      reject(error)
    })

    let device = event.device;

    var params = {
      id: id,
      type: device.type,
      gardenerId: device.gardenerId,
      gardenId: device.gardenId
    };

    device = new DeviceModel(params);

    await device.save().then(async () => {
      let garden = await GardenModel.find(device.gardenId).catch(error => {
        reject(error)
      })

      garden.devicesCount += 1

      await garden.save().catch(error => {
        reject(error)
      })

      callback(null, { statusCode: 200, body: JSON.stringify({ message: `Device successfully created!` }) });

      resolve(device)
    }).catch((error) => {
      console.log(error)
      callback(null, { statusCode: 400, body: JSON.stringify({ message: "Failed to save device on database." }) })
      reject(error)
    });
  })
}
