const moment = require('moment-timezone')
const BaseModel = require('./baseModel')

class PlantModel extends BaseModel {
  // GETTERS, SETTERS AND FUNCTIONS
  // set sensor(value) {
  //   this._sensor = value
  // }
  //
  // get sensor() {
  //   return this._sensor
  // }

}

PlantModel.idColumnName = 'id'
PlantModel.secondaryIdColumnName = 'createdAt'
PlantModel.tableName = process.env.dynamodbPlantTable;

PlantModel.validatesPresenceOf(
  'id',
  'name',
  'type',
  'soilHumidity',
  'soilHumidityStatus',
  'lumens',
  'lightStatus',
  'createdAt',
  'deviceId',
  'gardenId',
  'gardenerId'
)

PlantModel.validatesTypeOf({
  id: 'number',
  name: 'string',
  type: 'string',
  soilHumidity: 'number',
  soilHumidityStatus: 'string',
  lumens: 'number',
  lightStatus: 'string',
  createdAt: 'string',
  lastMeasuredAt: 'string',
  deviceId: 'number',
  gardenId: 'number',
  gardenerId: 'number',
})

PlantModel.beforeValidation(function() {
  if (!this.createdAt)
    this.createdAt = moment().tz('America/Sao_Paulo').format()

  if (!this.soilHumidity) {
    this.soilHumidity = 0
    this.soilHumidityStatus = 'off'
  }

  if (!this.lumens) {
    this.lumens = 0
    this.lightStatus = 'off'
  }
})

PlantModel.addJsonAttributes(
  'id',
  'name',
  'type',
  'soilHumidity',
  'soilHumidityStatus',
  'lumens',
  'lightStatus',
  'createdAt',
  'deviceId',
  'gardenId',
  'gardenerId'
)

PlantModel.registerIndexes({
  base: {
    hash: 'id'
  },
  DeviceId: {
    hash: 'deviceId'
  },
  GardenId: {
    hash: 'GardenId'
  },
  GardenerId: {
    hash: 'GardenerId'
  }
})

module.exports = PlantModel
