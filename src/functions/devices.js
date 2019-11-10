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
  try {
    return new Promise(async (resolve, reject) => {
      event = JSON.parse(event.body);

      let device = event.device;

      var params = {
        type: device.name,
        gardenerId: device.gardenerId,
        gardenId: device.gardenId
      };

      device = new DeviceModel(body);

      await device.save().then(async () => {
        let garden = await GardenModel.find(plant.gardenId).catch(error => {
          reject(error)
        })

        garden.devicesCount += 1

        await garden.save().catch(error => {
          reject(error)
        })


        callback(null, apiResponse(201, {
          body: {
            message: 'Device registered successfully!',
            plant: plant.toJson(),
          },
        }));

        resolve(plant)
      }).catch((errors) => {
        callback(null, apiResponse(400, {
          body: {
            errors,
            plant: plant.toJson(),
          },
        }));
      });
    })
  } catch(error) {
    console.log(error)
    callback(null, apiResponse(400, {
      body: {
        message: 'Failed to create device.',
      },
    }));
  }
}
