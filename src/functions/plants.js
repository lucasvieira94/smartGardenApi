const moment = require('moment');

const AWS = require('aws-sdk');
const apiGateway = new AWS.APIGateway();

const { PlantModel, GardenerModel, DeviceModel, GardenModel } = require('../models')

module.exports.getPlant = async (event, context, callback) => {

  let { plantId } = event.pathParameters || {};

  await PlantModel.find(plantId).then(plant => {
    if (plant) {
      Logger.info("fetching plant", { success: true, model: plant });
      callback(null, { statusCode: 200, body: JSON.stringify({ message: "Plant succesfully fetched", body: plant }) })
    } else {
      Logger.error("No plant with the provided id.", { success: false });
      //verificar o statusCode correto
      callback(null, { statusCode: 422, body: JSON.stringify({ message: "No plant to fetch" }) })
    }

  }).catch(error => {
    Logger.error("Can't fetch plant", { error: error });
    callback(null, { statusCode: 422, body: JSON.stringify({ message: "Can't fetch plant" }) })
  })
}

module.exports.newPlant = (event, context, callback) => {
  try {
    return new Promise(async (resolve, reject) => {
      if (event.body)
        event = event.body
      else
        event = JSON.parse(event.body);

      let id = await PlantModel.findAll().then(plants => {
        return (plants.length + 1)
      }).catch(error => {
        callback(null, { statusCode: 400, body: JSON.stringify({ message: "Failed to retrieve plant on database." }) })
        reject(error)
      })

      let plant = event.plant;

      var params = {
        id: id,
        name: plant.name,
        gardenerId: plant.gardenerId,
        gardenId: plant.gardenId,
        deviceId: plant.deviceId,
        type: plant.type
      };

      plant = new PlantModel(params);

      await plant.save().then(async () => {
        let device = await DeviceModel.find(plant.deviceId).catch(error => {
          reject(error)
        })

        device.plantsCount += 1

        await device.save().catch(error => {
          reject(error)
        })

        let garden = await GardenModel.find(plant.gardenId).catch(error => {
          reject(error)
        })

        garden.plantsCount += 1

        await garden.save().catch(error => {
          reject(error)
        })

        callback(null, { statusCode: 200, body: JSON.stringify({ message: "Plant registered successfully!", body: plant.toJson() }) })

        resolve(plant)
      }).catch((error) => {
        reject(error)
      });
    })
  } catch(error) {
    console.log(error)
    callback(null, apiResponse(400, {
      body: {
        message: 'Failed to create plant.',
      },
    }));
  }
}
