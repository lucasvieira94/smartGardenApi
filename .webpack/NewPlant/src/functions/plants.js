(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("moment-timezone");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

const { DynamoDB } = __webpack_require__(7);
const urlify = __webpack_require__(9).create({
  spaces: "-",
  trim: true,
  toLower: true
});
const uuidv1 = __webpack_require__(10);
const uuidv5 = __webpack_require__(11);

class BaseModel {
  constructor(props = {}) {
    this.setData(props);
    this.invokeCallbacks("after", "Initialize");
  }

  get db() {
    return this.constructor.db();
  }

  static db() {
    if (this.tableName) {
      return new DynamoDB(this.tableName);
    } else {
      return null;
    }
  }

  setData(props) {
    for (var [key, value] of Object.entries(props)) {
      if (value !== "" && value !== null && value !== undefined) {
        this[key] = value;
      }
    }
  }

  // ID
  get idColumnName() {
    return this.constructor.idColumnName;
  }

  get secondaryIdColumnName() {
    return this.constructor.secondaryIdColumnName;
  }

  static generateUUIDasId(attributeName) {
    this._generateUUIDasId = attributeName;
  }

  static idIsUUID() {
    return this._generateUUIDasId || false;
  }

  newRecord() {
    return this[this.idColumnName] === '' || this[this.idColumnName] === undefined || this[this.idColumnName] === null;
  }

  generateUUIDasId() {
    return new Promise((resolve, reject) => {
      if (this.newRecord()) {
        if (!this.constructor.idIsUUID()) {
          resolve();
        } else {
          if (this[this.constructor.idIsUUID()]) {
            if (this.idColumnName !== null) {
              this[this.idColumnName] = uuidv5(this[this.constructor.idIsUUID()], uuidv1());
              resolve();
            } else {
              reject({
                errors: {
                  idColumnName: 'is not defined'
                }
              });
            }
          } else {
            reject({
              errors: {
                tableName: 'is not defined'
              }
            });
          }
        }
      } else {
        resolve();
      }
    });
  }

  static autoIncrementId() {
    this._idIsAutoIncremented = true;
  }

  static idIsAutoIncremented() {
    return this._idIsAutoIncremented || false;
  }

  autoIncrementId() {
    return new Promise(async (resolve, reject) => {
      if (this.newRecord()) {
        if (!this.constructor.idIsAutoIncremented()) {
          resolve();
        } else {
          if (this.db) {
            if (this.idColumnName !== null) {
              const records = await this.db.findAll();
              this[this.idColumnName] = (records.map(record => parseInt(record[this.idColumnName])).sort().pop() || 0) + 1;
              resolve();
            } else {
              reject({
                errors: {
                  idColumnName: 'is not defined'
                }
              });
            }
          } else {
            reject({
              errors: {
                tableName: 'is not defined'
              }
            });
          }
        }
      } else {
        resolve();
      }
    });
  }

  // SAVE
  save() {
    return new Promise(async (resolve, reject) => {
      if (this.db) {
        this.isValid().then(() => {
          this.invokeCallbacks("before", "Save");
          this.invokeCallbacks("on", "Save");
          this.db.put(this.toJson()).then(() => {
            this.invokeCallbacks("after", "Save");
            resolve(this);
          }).catch(error => {
            reject(error);
          });
        }).catch(errors => {
          reject({
            errors
          });
        });
      } else {
        reject({
          errors: {
            tableName: 'is not defined'
          }
        });
      }
    });
  }

  // UPDATE
  update() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.isValid().then(() => {
          this.invokeCallbacks("before", "Update");
          this.invokeCallbacks("on", "Update");
          this.db.put(this.toJson()).then(data => {
            this.invokeCallbacks("after", "Update");
            resolve(data);
          }).catch(error => {
            reject(error);
          });
        }).catch(errors => {
          reject({
            errors
          });
        });
      } else {
        reject({
          errors: {
            tableName: 'is not defined'
          }
        });
      }
    });
  }

  delete() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.invokeCallbacks("before", "Delete");
        this.invokeCallbacks("on", "Delete");

        let keys = {
          [this.idColumnName]: this[this.idColumnName]
        };

        if (this.secondaryIdColumnName) {
          keys[this.secondaryIdColumnName] = this[this.secondaryIdColumnName];
        }

        this.db.delete(keys).then(data => {
          this.invokeCallbacks("after", "Delete");
          resolve(data);
        }).catch(error => {
          reject(error);
        });
      } else {
        reject({
          errors: {
            tableName: 'is not defined'
          }
        });
      }
    });
  }

  // TO JSON
  static addJsonAttributes(...attributes) {
    this._jsonAttributes = (this._jsonAttributes || []).concat(attributes);
  }

  static jsonAttributes() {
    return this._jsonAttributes || [];
  }

  toJson() {
    return this.customJson(this.constructor.jsonAttributes());
  }

  customJson(attrs) {
    const finalJson = {};
    for (const attr of attrs) {
      if (this[attr] && this[attr].toJson) {
        finalJson[attr] = this[attr].toJson();
      } else if (Array.isArray(this[attr])) {
        finalJson[attr] = this[attr].map(elem => {
          if (elem && elem.toJson) {
            return elem.toJson();
          } else {
            return elem;
          }
        });
      } else {
        finalJson[attr] = this[attr];
      }
    }
    return finalJson;
  }

  // VALIDATIONS
  isValid() {
    return new Promise(async (resolve, reject) => {
      this.errors = {};

      this.invokeCallbacks("before", "Validation");
      if (this.constructor.idIsUUID()) {
        this.generateUUIDasId();
      } else if (this.constructor.idIsAutoIncremented()) {
        await this.autoIncrementId();
      }
      this.generateSlug();

      this.validatePresence();
      this.validateType();
      this.validateInclusion();
      await this.validateAssociations();
      this.invokeCallbacks("on", "Validation");

      const valid = Object.keys(this.errors).length === 0;
      if (valid) {
        this.invokeCallbacks("after", "Validation");
        resolve(this);
      } else {
        reject(this.errors);
      }
    });
  }

  // PRESENCE
  static validatesPresenceOf(...attributes) {
    this._requiredVariables = (this._requiredVariables || []).concat(attributes);
  }

  get requiredVariables() {
    return this.constructor._requiredVariables || [];
  }

  validatePresence() {
    for (const attr of this.requiredVariables) {
      if (this[attr] === null || this[attr] === undefined || this[attr] === '') {
        this.errors[attr] = 'não pode ficar em branco.';
      }
    }
  }

  // TYPES
  static validatesTypeOf(attributes = {}) {
    this._typeVariables = Object.assign(this._typeVariables || {}, attributes);
  }

  get typeVariables() {
    return this.constructor._typeVariables || {};
  }

  validateType() {
    for (const [key, value] of Object.entries(this.typeVariables)) {
      if (!this[key]) {
        continue;
      } else {
        if (typeof value === 'string') {
          if (typeof this[key] !== value) {
            this.errors[key] = `é um(a) ${typeof this[key]} e deveria ser um(a) ${value}.`;
          }
        }
      }
    }
  }

  // ASSOCIATION
  static validatesAssociated(attributes = {}) {
    this._associatedVariables = Object.assign(this._associatedVariables || {}, attributes);
  }

  get associatedVariables() {
    return this.constructor._associatedVariables || {};
  }

  async validateAssociations() {
    for (const [key, value] of Object.entries(this.associatedVariables)) {
      if (!this[key]) {
        continue;
      } else {
        if (Array.isArray(this[key])) {
          for (const association of this[key]) {
            if (!(association instanceof value)) {
              this.errors[key] = `todos os elementos do array devem ser do tipo ${value}`;
            } else {
              await association.isValid().catch(errors => {
                this.errors[key] = `um dos elementos do array é invalido: ${JSON.stringify(errors)}`;
              });
            }
          }
        } else {
          if (!(this[key] instanceof value)) {
            this.errors[key] = `deve ser do tipo ${value}`;
          } else {
            await this[key].isValid().catch(errors => {
              this.errors[key] = `o elemento é inválido: ${errors}`;
            });
          }
        }
      }
    }
  }

  // INCLUSION
  static validatesInclusionOf(attributes = {}) {
    this._inclusionVariables = Object.assign(this._inclusionVariables || {}, attributes);
  }

  get inclusionVariables() {
    return this.constructor._inclusionVariables || {};
  }

  validateInclusion() {
    for (const [key, value] of Object.entries(this.inclusionVariables)) {
      if (!this[key]) {
        continue;
      } else {
        if (value.indexOf(this[key]) === -1) {
          this.errors[key] = `deve estar incluído em ${JSON.stringify(value)}, mas o valor é ${this[key]}.`;
        }
      }
    }
  }

  // CALLBACKS
  invokeCallbacks(callbackMoment, action) {
    const varName = `${callbackMoment}${action}Callbacks`;

    for (const callback of this.constructor[varName]() || []) {
      callback.call(this);
    }
  }

  static afterInitialize(...funcs) {
    const varName = `_afterInitializeCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static afterInitializeCallbacks() {
    return this._afterInitializeCallbacks;
  }

  static beforeValidation(...funcs) {
    const varName = `_beforeValidationCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static beforeValidationCallbacks() {
    return this._beforeValidationCallbacks;
  }

  static onValidation(...funcs) {
    const varName = `_onValidationCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static onValidationCallbacks() {
    return this._onValidationCallbacks;
  }

  static afterValidation(...funcs) {
    const varName = `_afterValidationCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static afterValidationCallbacks() {
    return this._afterValidationCallbacks;
  }

  static beforeSave(...funcs) {
    const varName = `_beforeSaveCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static beforeSaveCallbacks() {
    return this._beforeSaveCallbacks;
  }

  static onSave(...funcs) {
    const varName = `_onSaveCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static onSaveCallbacks() {
    return this._onSaveCallbacks;
  }

  static afterSave(...funcs) {
    const varName = `_afterSaveCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static afterSaveCallbacks() {
    return this._afterSaveCallbacks;
  }

  static beforeUpdate(...funcs) {
    const varName = `_beforeUpdateCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static beforeUpdateCallbacks() {
    return this._beforeUpdateCallbacks;
  }

  static onUpdate(...funcs) {
    const varName = `_onUpdateCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static onUpdateCallbacks() {
    return this._onUpdateCallbacks;
  }

  static afterUpdate(...funcs) {
    const varName = `_afterUpdateCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static afterUpdateCallbacks() {
    return this._afterUpdateCallbacks;
  }

  static beforeDelete(...funcs) {
    const varName = `_beforeDeleteCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static beforeDeleteCallbacks() {
    return this._beforeDeleteCallbacks;
  }

  static onDelete(...funcs) {
    const varName = `_onDeleteCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static onDeleteCallbacks() {
    return this._onDeleteCallbacks;
  }

  static afterDelete(...funcs) {
    const varName = `_afterDeleteCallbacks`;
    this[varName] = (this[varName] || []).concat(funcs);
  }

  static afterDeleteCallbacks() {
    return this._afterDeleteCallbacks;
  }

  // INDEXES
  static registerIndexes(indexes = {}) {
    this._indexes = indexes;
  }

  static getIndexes() {
    return this._indexes;
  }

  // CLASS METHODS
  static find(id, secondary = null) {

    return new Promise((resolve, reject) => {
      if (this.db()) {
        let idValue = id;
        if (this.idIsAutoIncremented()) {
          idValue = parseInt(id);
        }

        let keys = {
          [this.idColumnName]: idValue
        };

        if (this.secondaryIdColumnName) {
          keys[this.secondaryIdColumnName] = secondary;
        }

        this.db().find(keys).then(item => {
          resolve(new this(item));
        }).catch(error => {
          reject(error);
        });
      } else {
        reject({
          errors: {
            tableName: 'is not defined'
          }
        });
      }
    });
  }

  static where(args = {}, opts = {}) {
    Object.assign(opts, {
      indexes: this.getIndexes()
    });
    return new Promise((resolve, reject) => {
      if (this.db()) {
        this.db().where(args, opts).then(items => {
          resolve(items.map(item => new this(item)));
        }).catch(error => {
          reject(error);
        });
      } else {
        reject({
          errors: {
            tableName: 'is not defined'
          }
        });
      }
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      if (this.db()) {
        this.db().findAll().then(items => {
          resolve(items.map(item => {
            return new this(item);
          }));
        }).catch(error => {
          reject(error);
        });
      } else {
        reject({
          errors: {
            tableName: 'is not defined'
          }
        });
      }
    });
  }

  // SLUG
  static createSlugFrom(slugFromAttribute, slugAttribute = 'slug') {
    this._slugFromAttribute = slugFromAttribute;
    this._slugAttribute = slugAttribute;
  }

  static slugFromAttribute() {
    return this._slugFromAttribute;
  }

  static slugAttribute() {
    return this._slugAttribute;
  }

  static shouldGenerateSlug() {
    return this.slugFromAttribute() && this.slugAttribute();
  }

  generateSlug() {
    if (this.constructor.shouldGenerateSlug()) {
      const value = this[this.constructor.slugFromAttribute()];
      if (value) {
        this[this.constructor.slugAttribute()] = urlify(value);
      }
    }
  }
}

module.exports = BaseModel;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("aws-sdk");

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

const moment = __webpack_require__(4);

const AWS = __webpack_require__(2);
const apiGateway = new AWS.APIGateway();

const { PlantModel, GardenerModel, DeviceModel, GardenModel } = __webpack_require__(5);

module.exports.getPlant = async (event, context, callback) => {

  let { plantId } = event.pathParameters || {};

  await PlantModel.where({ id: parseInt(plantId) }).then(plant => {
    if (plant) {
      console.log("fetching plant", { success: true, model: plant });
      callback(null, { statusCode: 200, body: JSON.stringify({ message: "Plant succesfully fetched", body: plant }) });
    } else {
      console.log("No plant with the provided id.", { success: false });
      callback(null, { statusCode: 422, body: JSON.stringify({ message: "No plant to fetch" }) });
    }
  }).catch(error => {
    console.log("Can't fetch plant", { error: error });
    callback(null, { statusCode: 422, body: JSON.stringify({ message: "Can't fetch plant" }) });
  });
};

module.exports.listPlants = async (event, context, callback) => {

  let params = {};

  console.log(event);

  if (event.queryStringParameters.deviceId) {
    params['deviceId'] = {
      value: partseInt(event.queryStringParameters.deviceId)
    };
  }

  if (event.queryStringParameters.gardenId) {
    params['gardenId'] = {
      value: parseInt(event.queryStringParameters.gardenId)
    };
  }

  if (event.queryStringParameters.gardenerId) {
    params['gardenerId'] = {
      value: parseInt(event.queryStringParameters.gardenId)
    };
  }

  if (Object.keys(params).lenght == 0) callback(null, { statusCode: 422, body: JSON.stringify({ message: "No params passed!" }) });

  await PlantModel.where(params).then(plants => {
    let plantsResponse;
    if (plants.length > 0) {
      plantsResponse = plants.map(plant => {
        plant.toJson();
      });
      console.log("fetching plant", { success: true, model: plants });
      callback(null, { statusCode: 200, body: JSON.stringify({ message: "Plants succesfully fetched", body: plants }) });
    } else {
      callback(null, { statusCode: 422, body: JSON.stringify({ message: "No plant to fetch" }) });
    }
  }).catch(error => {
    console.log("Can't fetch plant", { error: error });
    callback(null, { statusCode: 422, body: JSON.stringify({ message: "Can't fetch plants" }) });
  });
};

module.exports.newPlant = (event, context, callback) => {
  try {
    return new Promise(async (resolve, reject) => {
      if (event.body) event = event.body;else event = JSON.parse(event.body);

      let id = await PlantModel.findAll().then(plants => {
        return plants.length + 1;
      }).catch(error => {
        callback(null, { statusCode: 400, body: JSON.stringify({ message: "Failed to retrieve plant on database." }) });
        reject(error);
      });

      let plant = event.plant;

      var params = {
        id: id,
        name: plant.name,
        gardenerId: plant.gardenerId,
        gardenId: plant.gardenId,
        deviceId: plant.deviceId,
        type: plant.type
      };

      plant = new PlantModel(params);

      console.log(plant);

      await plant.save().then(async () => {
        let device = await DeviceModel.find(plant.deviceId).catch(error => {
          reject(error);
        });

        console.log(device);

        device.plantsCount += 1;

        await device.save().catch(error => {
          reject(error);
        });

        let garden = await GardenModel.find(plant.gardenId).catch(error => {
          reject(error);
        });

        garden.plantsCount += 1;

        await garden.save().catch(error => {
          reject(error);
        });

        callback(null, { statusCode: 200, body: JSON.stringify({ message: "Plant registered successfully!", body: plant.toJson() }) });

        resolve(plant);
      }).catch(error => {
        reject(error);
      });
    });
  } catch (error) {
    console.log(error);
    callback(null, apiResponse(400, {
      body: {
        message: 'Failed to create plant.'
      }
    }));
  }
};

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("moment");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

const MeasureModel = __webpack_require__(6);
const GardenerModel = __webpack_require__(12);
const DeviceModel = __webpack_require__(13);
const PlantModel = __webpack_require__(14);
const GardenModel = __webpack_require__(15);

module.exports = {
  MeasureModel,
  GardenerModel,
  DeviceModel,
  PlantModel,
  GardenModel
};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

const moment = __webpack_require__(0);
const BaseModel = __webpack_require__(1);

class MeasureModel extends BaseModel {
  // GETTERS, SETTERS AND FUNCTIONS
  // set sensor(value) {
  //   this._sensor = value
  // }
  //
  // get sensor() {
  //   return this._sensor
  // }

}

MeasureModel.idColumnName = 'id';
MeasureModel.secondaryIdColumnName = 'measuredAt';
MeasureModel.tableName = process.env.dynamodbMeasureTable;

MeasureModel.validatesPresenceOf('id', 'sensor', 'value', 'measuredAt', 'plantId');

MeasureModel.validatesTypeOf({
  id: 'string',
  sensor: 'string',
  value: 'string',
  measuredAt: 'string',
  plantId: 'number'
});

MeasureModel.beforeValidation(function () {
  if (!this.measuredAt) {
    this.measuredAt = moment().tz('America/Sao_Paulo').format();
  }
});

MeasureModel.addJsonAttributes('id', 'sensor', 'value', 'state', 'measuredAt', 'plantId');

MeasureModel.generateUUIDasId('measuredAt');

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
});

module.exports = MeasureModel;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

const DynamoDB = __webpack_require__(8);

module.exports = {
  DynamoDB
};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

const AWS = __webpack_require__(2);
const dynamoDb = new AWS.DynamoDB.DocumentClient();

class DynamoDB {
  constructor(tableName) {
    this.tableName = tableName;
  }

  findAll() {
    return this.getAll({
      TableName: this.tableName
    });
  }

  find(idObject) {
    let keyParams = {};
    for (const [key, value] of Object.entries(idObject)) {
      keyParams[key] = value;
    }

    return dynamoDb.get({
      TableName: this.tableName,
      Key: keyParams
    }).promise().then(data => data.Item);
  }

  put(json) {
    return dynamoDb.put({
      TableName: this.tableName,
      Item: json
    }).promise();
  }

  delete(keys) {
    return dynamoDb.delete({
      TableName: this.tableName,
      Key: keys
    }).promise();
  }

  update(keys, args = {}) {
    const params = this.generateExpressions(args, { update: true });
    params["Key"] = keys;

    return dynamoDb.update(params).promise();
  }

  where(args = {}, opts = {}) {
    const params = this.generateExpressions(args, opts);

    return this.getAll(params);
  }

  async getAll(params) {
    console.log(params);
    let { items, lastEvaluatedKey } = await this.getAllRequest(params);
    let response = {
      items: items
    };
    if (params["Paginated"]) {
      delete params["Paginated"];
      response.lastEvaluatedKey = lastEvaluatedKey;
      return response;
    } else {
      while (lastEvaluatedKey) {
        params["ExclusiveStartKey"] = lastEvaluatedKey;
        const scanReturn = await this.getAllRequest(params);
        items = items.concat(scanReturn.items);
        lastEvaluatedKey = scanReturn.lastEvaluatedKey;
      }
      return items;
    }
  }

  getAllRequest(params) {
    const promise = params['KeyConditionExpression'] ? dynamoDb.query(params).promise() : dynamoDb.scan(params).promise();

    return promise.then(data => {
      return {
        items: data.Items,
        lastEvaluatedKey: data.LastEvaluatedKey
      };
    });
  }

  batchWrite(records, args = {}) {
    const putRequests = records.map(record => {
      for (const [key, value] of Object.entries(args)) {
        record[key] = value;
      }

      return {
        PutRequest: {
          Item: record
        }
      };
    });

    const putRequestsChunks = divideArrayInChunks(putRequests, 25);
    return new Promise((resolve, reject) => {
      Promise.all(putRequestsChunks.map(chunk => {
        return dynamoDb.batchWrite({
          RequestItems: {
            [this.tableName]: chunk
          }
        }).promise();
      })).then(allResponses => {
        let unprocessedItems = [];
        for (const response of allResponses) {
          if (response.UnprocessedItems && Object.keys(response.UnprocessedItems).length > 0) {
            unprocessedItems = unprocessedItems.concat(response.UnprocessedItems[this.tableName].map(item => item.PutRequest.Item));
          }
        }
        if (unprocessedItems.length > 0) {
          reject({
            unprocessedItems
          });
        } else {
          resolve(allResponses);
        }
      }).catch(error => {
        reject({
          error
        });
      });
    });
  }

  async guaranteedBatchWrite(records, args = {}) {
    let unprocessedItems = records;
    let error = null;

    while (unprocessedItems.length > 0 && error === null) {
      await this.batchWrite(unprocessedItems, args).then(() => {
        unprocessedItems = [];
      }).catch(errorObject => {
        if (errorObject.error) {
          error = errorObject.error;
        } else {
          unprocessedItems = errorObject.unprocessedItems;
        }
      });
    }

    return new Promise((resolve, reject) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  }

  generateExpressions(args = {}, opts = {}) {
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    let KeyConditionExpressions = [];
    let Expressions = [];
    let counter = 0;

    let indexName;
    let index;
    for (const [key, value] of Object.entries(opts.indexes)) {
      if (args[value.hash] || args[value.hash] === 0) {
        indexName = key;
        index = value;
      }
    }

    for (const [key, value] of Object.entries(args)) {
      const attributeName = `#var${counter}`;
      const attributeValue = `:var${counter}`;

      const isObject = typeof value === 'object' && value !== null;

      const operator = isObject ? value.operator || '=' : '=';
      let finalValue = isObject ? value.value : value;

      if (key != "exclusiveStartKey") if (index && (key === index.hash || key === index.range)) {
        ExpressionAttributeNames[attributeName] = key;
        if (operator === 'between') {
          ExpressionAttributeValues[`${attributeValue}min`] = value.min;
          ExpressionAttributeValues[`${attributeValue}max`] = value.max;
          KeyConditionExpressions.push(`${attributeName} between ${attributeValue}min and ${attributeValue}max`);
        } else if (finalValue === null) {
          KeyConditionExpressions.push(`attribute_not_exists(${attributeName})`);
        } else {
          ExpressionAttributeValues[`${attributeValue}`] = finalValue;
          KeyConditionExpressions.push(`${attributeName} ${operator} ${attributeValue}`);
        }
      } else {
        let extraParts = [];
        let partCounter = 0;
        for (const part of key.split('.').slice(0, -1)) {
          const attrName = `${attributeName}${partCounter}`;
          ExpressionAttributeNames[attrName] = part;
          extraParts.push(attrName);
          partCounter++;
        }
        ExpressionAttributeNames[attributeName] = key.split('.').splice(-1)[0];

        if (finalValue === null && !opts.update) {
          if (operator === 'between') {
            ExpressionAttributeValues[`${attributeValue}min`] = value.min;
            ExpressionAttributeValues[`${attributeValue}max`] = value.max;
            Expressions.push(`${attributeName} between ${attributeValue}min and ${attributeValue}max`);
          } else {
            Expressions.push(`attribute_not_exists(${attributeName})`);
          }
        } else if (key == 'created_at') {
          ExpressionAttributeValues[`${attributeValue}min`] = value.min;
          ExpressionAttributeValues[`${attributeValue}max`] = value.max;
          Expressions.push(`${attributeName} between ${attributeValue}min and ${attributeValue}max`);
        } else {
          ExpressionAttributeValues[attributeValue] = finalValue;

          let finalAttributeName;
          if (extraParts.length > 0) {
            extraParts.push(attributeName);
            finalAttributeName = extraParts.join('.');
          } else {
            finalAttributeName = attributeName;
          }
          Expressions.push(`${finalAttributeName} ${operator} ${attributeValue}`);
        }
      }

      counter++;
    }

    const params = {
      TableName: this.tableName
    };

    if (Object.entries(ExpressionAttributeNames).length > 0) {
      params["ExpressionAttributeNames"] = ExpressionAttributeNames;
    }

    if (Object.entries(ExpressionAttributeValues).length > 0) {
      params["ExpressionAttributeValues"] = ExpressionAttributeValues;
    }

    if (KeyConditionExpressions.length > 0) {
      if (indexName !== 'base') {
        params["IndexName"] = indexName;
      }
      params["KeyConditionExpression"] = KeyConditionExpressions.join(' and ');
    }

    if (Expressions.length > 0) {
      if (opts.update) {
        params["UpdateExpression"] = `set ${Expressions.join(', ')}`;
      } else {
        params["FilterExpression"] = Expressions.join(' AND ');
      }
    }

    if (opts.limit) params["Limit"] = opts.limit;

    if (opts.paginated) params["Paginated"] = opts.paginated;

    if (args.exclusiveStartKey) params["ExclusiveStartKey"] = args.exclusiveStartKey;

    return params;
  }
}

const divideArrayInChunks = (array, chunkSize) => {
  return array.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / chunkSize);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
};

module.exports = DynamoDB;

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("urlify");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("uuid/v1");

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("uuid/v5");

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

const moment = __webpack_require__(0);
const BaseModel = __webpack_require__(1);

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

GardenerModel.idColumnName = 'id';
GardenerModel.tableName = process.env.dynamodbGardenerTable;

GardenerModel.validatesPresenceOf('id', 'name', 'email');

GardenerModel.validatesTypeOf({
  id: 'number',
  name: 'string',
  email: 'string',
  cognitoUserId: 'string'
});

GardenerModel.addJsonAttributes('id', 'name', 'email', 'cognitoUserId');

GardenerModel.registerIndexes({
  base: {
    hash: 'id'
  }
});

module.exports = GardenerModel;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

const moment = __webpack_require__(0);
const BaseModel = __webpack_require__(1);

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

DeviceModel.idColumnName = 'id';
DeviceModel.tableName = process.env.dynamodbDeviceTable;

DeviceModel.beforeValidation(function () {
  if (!this.plantsCount) this.plantsCount = 0;

  if (!this.createdAt) this.createdAt = moment().tz('America/Sao_Paulo').format();

  if (!this.status) this.status = 'off';
});

DeviceModel.validatesPresenceOf('id', 'type', 'status', 'plantsCount', 'gardenId', 'gardenerId', 'createdAt');

DeviceModel.validatesTypeOf({
  id: 'number',
  type: 'string',
  status: 'string',
  plantsCount: 'number',
  gardenId: 'number',
  gardenerId: 'number',
  createdAt: 'string'
});

DeviceModel.addJsonAttributes('id', 'deviceType', 'status', 'plantsCount', 'gardenId', 'gardenerId', 'createdAt');

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
});

module.exports = DeviceModel;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

const moment = __webpack_require__(0);
const BaseModel = __webpack_require__(1);

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

PlantModel.idColumnName = 'id';
PlantModel.secondaryIdColumnName = 'createdAt';
PlantModel.tableName = process.env.dynamodbPlantTable;

PlantModel.validatesPresenceOf('id', 'name', 'type', 'soilHumidity', 'soilHumidityStatus', 'lumens', 'lightStatus', 'createdAt', 'deviceId', 'gardenId', 'gardenerId');

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
  gardenerId: 'number'
});

PlantModel.beforeValidation(function () {
  if (!this.createdAt) this.createdAt = moment().tz('America/Sao_Paulo').format();

  if (!this.soilHumidity) {
    this.soilHumidity = 0;
    this.soilHumidityStatus = 'off';
  }

  if (!this.lumens) {
    this.lumens = 0;
    this.lightStatus = 'off';
  }
});

PlantModel.addJsonAttributes('id', 'name', 'type', 'soilHumidity', 'soilHumidityStatus', 'lumens', 'lightStatus', 'createdAt', 'deviceId', 'gardenId', 'gardenerId');

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
});

module.exports = PlantModel;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

const moment = __webpack_require__(0);
const BaseModel = __webpack_require__(1);

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

GardenModel.idColumnName = 'id';
GardenModel.tableName = process.env.dynamodbGardenTable;

GardenModel.beforeValidation(function () {
  if (!this.plantsCount) this.plantsCount = 0;

  if (!this.devicesCount) this.devicesCount = 0;

  if (!this.createdAt) this.createdAt = moment().tz('America/Sao_Paulo').format();
});

GardenModel.validatesPresenceOf('id', 'name', 'plantsCount', 'devicesCount', 'gardenerId', 'createdAt');

GardenModel.validatesTypeOf({
  id: 'number',
  name: 'string',
  plantsCount: 'number',
  devicesCount: 'number',
  gardenerId: 'number',
  createdAt: 'string'
});

GardenModel.addJsonAttributes('id', 'name', 'plantsCount', 'devicesCount', 'gardenerId', 'createdAt');

GardenModel.registerIndexes({
  base: {
    hash: 'id'
  },
  GardenerId: {
    hash: 'gardenerId'
  }
});

module.exports = GardenModel;

/***/ })
/******/ ])));
//# sourceMappingURL=plants.js.map