const moment = require('moment-timezone')
const BaseModel = require('./baseModel')

class GardenModel extends BaseModel {
  // GETTERS, SETTERS AND FUNCTIONS
  // set name(value) {
  //   this._name = value
  // }
  //
  // get name() {
  //   return this._name
  // }

}

GardenModel.idColumnName = 'id'
GardenModel.tableName = process.env.dynamodbGardenTable

GardenModel.beforeCreation(function() {
  if (!this.plantsCount)
    this.plantsCount = 0

  if (!this.devicesCount)
    this.devicesCount = 0

  if (!this.createdAt)
    this.createdAt = moment().tz('America/Sao_Paulo').format();
})

GardenModel.validatesPresenceOf(
  'id',
  'name',
  'plantsCount',
  'devicesCount',
  'gardenerId',
  'createdAt'
)

DeviceModel.validatesTypeOf({
  id: 'number',
  name: 'string',
  plantsCount: 'number',
  devicesCount: 'number',
  gardenerId: 'number',
  createdAt: 'string'
})


GardenModel.addJsonAttributes(
  'id',
  'name',
  'plantsCount',
  'devicesCount',
  'gardenerId',
  'createdAt'
)

GardenModel.registerIndexes({
  base: {
    hash: 'id'
  },
  GardenerId: {
    hash: 'gardenerId'
  }
})

module.exports = GardenModel
