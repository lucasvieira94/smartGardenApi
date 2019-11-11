const moment = require('moment-timezone')
const BaseModel = require('./baseModel')

class GardenerModel extends BaseModel {
  // GETTERS, SETTERS AND FUNCTIONS
  // set name(value) {
  //   this._name = value
  // }
  //
  // get name() {
  //   return this._name
  // }

}

GardenerModel.idColumnName = 'id'
GardenerModel.tableName = process.env.dynamodbGardenerTable

GardenerModel.validatesPresenceOf(
  'id',
  'name',
  'email'
)

GardenerModel.validatesTypeOf({
  id: 'number',
  name: 'string',
  email: 'string',
  cognitoUserId: 'string'
})


GardenerModel.addJsonAttributes(
  'id',
  'name',
  'email',
  'cognitoUserId'
)

GardenerModel.registerIndexes({
  base: {
    hash: 'id'
  },
})

module.exports = GardenerModel
