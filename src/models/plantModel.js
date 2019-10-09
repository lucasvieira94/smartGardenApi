const moment = require('moment-timezone')
const BaseModel = require('./baseModel')

class PlantModel extends BaseModel {
  // GETTERS, SETTERS AND FUNCTIONS
  set sensor(value) {
    this._sensor = value
  }

  get sensor() {
    return this._sensor
  }

}

PlantModel.idColumnName = 'id'
PlantModel.secondaryIdColumnName = 'createdAt'
PlantModel.tableName = process.env.dynamodbPlantTable;

PlantModel.validatesPresenceOf(
  'id',
  'name',
  'type',
  'soilHumidity'
  'soilHumidityStatus',
  'lumens',
  'lightStatus',
  'updatedAt',
  'createdAt',
  'gardenDeviceId'
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
  gardenDeviceId: 'number'
})

PlantModel.beforeValidation(function() {
  if (!this.createdAt) {
    this.createdAt = moment().tz('America/Sao_Paulo').format()
  }
})

PlantModel.addJsonAttributes(
  'id',
  'name',
  'type',
  'soilHumidity'
  'soilHumidityStatus',
  'lumens',
  'lightStatus',
  'updatedAt',
  'createdAt',
  'gardenDeviceId'
)

PlantModel.registerIndexes({
  base: {
    hash: 'id',
    rash: 'createdAt'
  },
  GardenDeviceId: {
    hash: 'gardenDeviceId',
    rash: 'createdAt'
  }
})

module.exports = PlantModel
