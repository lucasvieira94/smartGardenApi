const moment = require('moment-timezone')
const BaseModel = require('./baseModel')

class MeasureModel extends BaseModel {
  // GETTERS, SETTERS AND FUNCTIONS
  set sensor(value) {
    this._sensor = value;
  }

  get sensor() {
    return this._sensor;
  }

}

MeasureModel.idColumnName = 'id';
MeasureModel.secondaryIdColumnName = 'measuredAt';
MeasureModel.tableName = process.env.dynamodbMeasureTable;

MeasureModel.validatesPresenceOf(
  'id',
  'sensor',
  'value',
  'measuredAt'
)

MeasureModel.validatesTypeOf({
  id: 'string',
  sensor: 'string',
  value: 'string',
  measuredAt: 'string'
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
  'measuredAt'
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
  }
})

module.exports = MeasureModel;
