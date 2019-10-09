const moment = require('moment-timezone')
const BaseModel = require('./baseModel')

class MeasureModel extends BaseModel {
  // GETTERS, SETTERS AND FUNCTIONS
  set sensor(value) {
    this._sensor = value
  }

  get sensor() {
    return this._sensor
  }

}

MeasureModel.idColumnName = 'id';
MeasureModel.secondaryIdColumnName = 'measuredAt';
MeasureModel.tableName = process.env.dynamodbMeasureTable;

MeasureModel.validatesPresenceOf(
  'id',
  'sensor',
  'value',
  'measuredAt',
  'plantId'
)

MeasureModel.validatesTypeOf({
  id: 'string',
  sensor: 'string',
  value: 'string',
  measuredAt: 'string',
  plantId: 'number'
})

MeasureModel.beforeValidation(function() {
  if (!this.measuredAt) {
    this.measuredAt = moment().tz('America/Sao_Paulo').format();
  }
})

MeasureModel.addJsonAttributes(
  'id',
  'sensor',
  'value',
  'state',
  'measuredAt',
  'plantId'
)

MeasureModel.generateUUIDasId('measuredAt')

MeasureModel.registerIndexes({
  base: {
    hash: 'id',
    range: 'measuredAt'
  },
  Sensor: {
    hash: 'sensor',
    range: 'measuredAt'
  },
  PlantId: {
    hash: 'plantId',
    range: 'measuredAt'
  }
})

module.exports = MeasureModel
