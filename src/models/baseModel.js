const { DynamoDB } = require('../utils/aws/index');
const urlify = require('urlify').create({
  spaces: "-",
  trim: true,
  toLower: true,
});
const uuidv1 = require('uuid/v1');
const uuidv5 = require('uuid/v5');

class BaseModel {
  constructor(props = {}) {
    this.setData(props);
    this.invokeCallbacks("after", "Initialize")
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
      return (
        this[this.idColumnName] === ''
        || this[this.idColumnName] === undefined
        || this[this.idColumnName] === null
      )
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
                resolve()
              } else {
                reject({
                  errors: {
                    idColumnName: 'is not defined',
                  },
                })
              }
            } else {
              reject({
                errors: {
                  tableName: 'is not defined',
                },
              })
            }
          }
        } else {
          resolve();
        }
      })
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
                this[this.idColumnName] = (records.map(record => parseInt(record[this.idColumnName])).sort().pop() || 0) + 1
                resolve();
              } else {
                reject({
                  errors: {
                    idColumnName: 'is not defined',
                  },
                })
              }
            } else {
              reject({
                errors: {
                  tableName: 'is not defined',
                },
              })
            }
          }
        } else {
          resolve();
        }
      })
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
            })
          }).catch(errors => {
            reject({
              errors,
            });
          })
        } else {
          reject({
            errors: {
              tableName: 'is not defined',
            },
          });
        }
      })
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
            })
          }).catch(errors => {
            reject({
              errors,
            });
          })
        } else {
          reject({
            errors: {
              tableName: 'is not defined',
            },
          })
        }
      })
    }

    delete() {
      return new Promise((resolve, reject) => {
        if (this.db) {
          this.invokeCallbacks("before", "Delete");
          this.invokeCallbacks("on", "Delete");

          let keys = {
            [this.idColumnName]: this[this.idColumnName],
          }

          if (this.secondaryIdColumnName) {
            keys[this.secondaryIdColumnName] = this[this.secondaryIdColumnName];
          }

          this.db.delete(keys).then(data => {
            this.invokeCallbacks("after", "Delete");
            resolve(data);
          }).catch(error => {
            reject(error);
          })
        } else {
          reject({
            errors: {
              tableName: 'is not defined',
            },
          })
        }
      })
    }

  // TO JSON
    static addJsonAttributes(...attributes) {
      this._jsonAttributes = (this._jsonAttributes || []).concat(attributes);
    }

    static jsonAttributes() {
      return this._jsonAttributes || [];
    }

    toJson() {
      return this.customJson(this.constructor.jsonAttributes())
    }

    customJson(attrs) {
      const finalJson = {}
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
          })
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
        await this.validateAssociations()
        this.invokeCallbacks("on", "Validation");

        const valid = (Object.keys(this.errors).length === 0);
        if (valid) {
          this.invokeCallbacks("after", "Validation");
          resolve(this)
        } else {
          reject(this.errors)
        }
      })
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
      this._typeVariables = Object.assign((this._typeVariables || {}), attributes);
    }

    get typeVariables() {
      return this.constructor._typeVariables || {};
    }

    validateType() {
      for (const [key, value] of Object.entries(this.typeVariables)) {
        if (!this[key]) {
          continue;
        } else {
          if (typeof(value) === 'string') {
            if (typeof(this[key]) !== value) {
              this.errors[key] = `é um(a) ${typeof(this[key])} e deveria ser um(a) ${value}.`;
            }
          }
        }
      }
    }

    // ASSOCIATION
    static validatesAssociated(attributes = {}) {
      this._associatedVariables = Object.assign((this._associatedVariables || {}), attributes);
    }

    get associatedVariables() {
      return this.constructor._associatedVariables || {}
    }

    async validateAssociations() {
      for (const [key, value] of Object.entries(this.associatedVariables)) {
        if (!this[key]) {
          continue;
        } else {
          if (Array.isArray(this[key])) {
            for (const association of this[key]) {
              if (!(association instanceof value)) {
                this.errors[key] = `todos os elementos do array devem ser do tipo ${value}`
              } else {
                await association.isValid().catch(errors => {
                  this.errors[key] = `um dos elementos do array é invalido: ${JSON.stringify(errors)}`
                })
              }
            }
          } else {
            if (!(this[key] instanceof value)) {
              this.errors[key] = `deve ser do tipo ${value}`
            } else {
              await this[key].isValid().catch(errors => {
                this.errors[key] = `o elemento é inválido: ${errors}`
              })
            }
          }
        }
      }
    }

    // INCLUSION
    static validatesInclusionOf(attributes = {}) {
      this._inclusionVariables = Object.assign((this._inclusionVariables || {}), attributes);
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

      for (const callback of (this.constructor[varName]() || [])) {
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
            [this.idColumnName]: idValue,
          }

          if (this.secondaryIdColumnName) {
            keys[this.secondaryIdColumnName] = secondary;
          }

          this.db().find(keys).then(item => {
            resolve(new this(item));
          }).catch(error => {
            reject(error);
          })
        } else {
          reject({
            errors: {
              tableName: 'is not defined',
            },
          })
        }
      })
    }

    static where(args = {}, opts = {}) {
      Object.assign(opts, {
        indexes: this.getIndexes(),
      });
      return new Promise((resolve, reject) => {
        if (this.db()) {
          this.db().where(args, opts).then(items => {
            resolve(items.map(item => new this(item)));
          }).catch(error => {
            reject(error);
          })
        } else {
          reject({
            errors: {
              tableName: 'is not defined',
            },
          })
        }
      })
    }

    static findAll() {
      return new Promise((resolve, reject) => {
        if (this.db()) {
          this.db().findAll().then(items => {
            resolve(items.map(item => {
              return new this(item);
            }))
          }).catch(error => {
            reject(error);
          })
        } else {
          reject({
            errors: {
              tableName: 'is not defined',
            },
          })
        }
      })
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
        const value = this[this.constructor.slugFromAttribute()]
        if (value) {
          this[this.constructor.slugAttribute()] = urlify(value)
        }
      }
    }
}

module.exports = BaseModel;
