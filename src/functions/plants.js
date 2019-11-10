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
      event = JSON.parse(event.body);

      let plant = event.garden;

      var params = {
        name: plant.name,
        gardenerId: plant.gardenerId,
        gardenId: plant.gardenId,
        deviceId: plant.deviceId,
        type: plant.type
      };

      plant = new PlantModel(body);

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


        callback(null, apiResponse(201, {
          body: {
            message: 'Plant registered successfully!',
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
        message: 'Failed to create plant.',
      },
    }));
  }
}
