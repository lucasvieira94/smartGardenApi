const moment = require('moment');

const AWS = require('aws-sdk');
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
const apiGateway = new AWS.APIGateway();

const { GardenerModel } = require('../models')

module.exports.newGardener = async (event, context, callback) => {
  return new Promise(async (resolve, reject) => {

    if (event.body)
      event = event.body
    else
      event = JSON.parse(event.body);

    let gardener = event.gardener;

    let id = await GardenerModel.findAll().then(garderners => {
      return (garderners.length + 1)
    }).catch(error => {
      callback(null, { statusCode: 400, body: JSON.stringify({ message: "Failed to retrieve gardeners on database." }) })
      reject(error)
    })

    var params = {
      id: id,
      name: gardener.name,
      email: gardener.email
    };

    gardener = new GardenerModel(params);

    await gardener.save().then(async gardener => {
      let poolId = process.env.gardenerUserPoolId;

      await cognitoIdentityServiceProvider.adminCreateUser({
        UserPoolId: poolId,
        Username: gardener.email,
        DesiredDeliveryMediums: ['EMAIL'],
        UserAttributes: [
          {
            Name: "email",
            Value: gardener.email,
          },
          {
            Name: "email_verified",
            Value: "True",
          },
          {
            Name: "phone_number_verified",
            Value: "False",
          }
        ],
      }).promise().then(data => {
        gardener.cognitoUserId = data.User.Username
        gardener.save().then(gardener => {
          callback(null, { statusCode: 200, body: JSON.stringify({ message: `Gardener ${gardener.name} successfully created!` }) });
          resolve(gardener);
        }).catch(error => {
          callback(null, { statusCode: 400, body: JSON.stringify({ message: "Failed to update gardener cognito id." }) })
          reject(error)
        })
      }).catch(error => {
        console.log(error)
        callback(null, { statusCode: 422, body: JSON.stringify({ message: "Failed to create gardener on cognito." }) });
        reject(error)
      })
    }).catch(error => {
      console.log(error)
      callback(null, { statusCode: 400, body: JSON.stringify({ message: "Failed to save gardener on database." }) })
      reject(error)
    })

  })
}
