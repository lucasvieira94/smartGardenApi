const moment = require('moment-timezone')
const BaseModel = require('./baseModel')

class GardenDeviceModel extends BaseModel {
  // GETTERS, SETTERS AND FUNCTIONS
  set name(value) {
    this._name = value
  }

  get name() {
    return this._name
  }

}

GardenDeviceModel.idColumnName = 'id'
GardenDeviceModel.tableName = process.env.dynamodbGardenDeviceTable

GardenDeviceModel.validatesPresenceOf(
  'id',
  'name',
  'deviceType',
  'status',
  'plantsCount',
  'gardenerId'
)

GardenDeviceModel.validatesTypeOf({
  id: 'number',
  name: 'string',
  deviceType: 'string',
  status: 'string',
  plantsCount: 'number',
  gardenerId: 'number'
})


GardenDeviceModel.addJsonAttributes(
  'id',
  'name',
  'deviceType',
  'status',
  'plantsCount',
  'gardenerId'
)

GardenDeviceModel.registerIndexes({
  base: {
    hash: 'id'
  },
  GardenerId: {
    hash: 'gardenerId'
  }
})

module.exports = GardenerModel
