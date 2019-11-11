const moment = require('moment-timezone')
const BaseModel = require('./baseModel')

class DeviceModel extends BaseModel {
  // GETTERS, SETTERS AND FUNCTIONS
  // set name(value) {
  //   this._name = value
  // }
  //
  // get name() {
  //   return this._name
  // }

}

DeviceModel.idColumnName = 'id'
DeviceModel.tableName = process.env.dynamodbDeviceTable

DeviceModel.beforeValidation(function() {
  if (!this.plantsCount)
    this.plantsCount = 0

  if (!this.createdAt)
    this.createdAt = moment().tz('America/Sao_Paulo').format();

  if (!this.status)
    this.status = 'off'
})

DeviceModel.validatesPresenceOf(
  'id',
  'type',
  'status',
  'plantsCount',
  'gardenId',
  'gardenerId',
  'createdAt'
)

DeviceModel.validatesTypeOf({
  id: 'number',
  type: 'string',
  status: 'string',
  plantsCount: 'number',
  gardenId: 'number',
  gardenerId: 'number',
  createdAt: 'string'
})


DeviceModel.addJsonAttributes(
  'id',
  'deviceType',
  'status',
  'plantsCount',
  'gardenId',
  'gardenerId',
  'createdAt'
)

DeviceModel.registerIndexes({
  base: {
    hash: 'id'
  },
  GardenId: {
    hash: 'gardenId'
  },
  GardenerId: {
    hash: 'gardenerId'
  }
})

module.exports = DeviceModel
