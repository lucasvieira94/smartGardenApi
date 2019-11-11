const moment = require('moment');

const AWS = require('aws-sdk');
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
const apiGateway = new AWS.APIGateway();

const { GardenModel } = require('../models')

module.exports.newGarden = async (event, context, callback) => {
  return new Promise(async (resolve, reject) => {

    if (event.body)
      event = event.body
    else
      event = JSON.parse(event.body);

    let id = await GardenModel.findAll().then(garderns => {
      return (garderns.length + 1)
    }).catch(error => {
      callback(null, { statusCode: 400, body: JSON.stringify({ message: "Failed to retrieve gardens on database." }) })
      reject(error)
    })

    let garden = event.garden;

    var params = {
      id: id,
      name: garden.name,
      gardenerId: garden.gardenerId
    };

    garden = new GardenModel(params);

    await garden.save().then(async garden => {
      callback(null, { statusCode: 200, body: JSON.stringify({ message: `Garden successfully created!` }) });
      resolve(garden);
    }).catch(error => {
      console.log(error)
      callback(null, { statusCode: 400, body: JSON.stringify({ message: "Failed to save garden on database." }) })
      reject(error)
    })

  })
}
