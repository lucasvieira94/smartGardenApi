const moment = require('moment');

const AWS = require('aws-sdk');
const apiGateway = new AWS.APIGateway();

const { PlantModel } = require('../models')

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
    const body = JSON.parse(event.body);
    const plant = new PlantModel(body);

    plant.save().then(() => {
      callback(null, apiResponse(201, {
        body: {
          message: 'Plant registered successfully!',
          plant: plant.toJson(),
        },
      }));
    }).catch((errors) => {
      callback(null, apiResponse(400, {
        body: {
          errors,
          plant: plant.toJson(),
        },
      }));
    });
  } catch(e) {
    callback(null, apiResponse(400, {
      body: {
        message: 'invalid body',
      },
    }));
  }
}
