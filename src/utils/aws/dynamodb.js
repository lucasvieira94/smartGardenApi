const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

class DynamoDB {
  constructor(tableName) {
    this.tableName = tableName;
  }

  findAll() {
    return this.getAll({
      TableName: this.tableName,
    });
  }

  find(idObject) {
    let keyParams = {};
    for (const [key, value] of Object.entries(idObject)) {
      keyParams[key] = value;
    }

    return dynamoDb.get({
      TableName: this.tableName,
      Key: keyParams,
    }).promise().then(data => data.Item)
  }

  put(json) {
    return dynamoDb.put({
      TableName: this.tableName,
      Item: json,
    }).promise()
  }

  delete(keys) {
    return dynamoDb.delete({
      TableName: this.tableName,
      Key: keys,
    }).promise()
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
    console.log(params)
    let { items, lastEvaluatedKey } = await this.getAllRequest(params);
    let response = {
      items: items
    }
    if (params["Paginated"]) {
      delete params["Paginated"]
      response.lastEvaluatedKey = lastEvaluatedKey
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
    const promise = params['KeyConditionExpression']
      ? dynamoDb.query(params).promise()
      : dynamoDb.scan(params).promise()

    return promise
      .then(data => {
        return {
          items: data.Items,
          lastEvaluatedKey: data.LastEvaluatedKey,
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
          Item: record,
        },
      }
    })

    const putRequestsChunks = divideArrayInChunks(putRequests, 25);
    return new Promise((resolve, reject) => {
      Promise.all(putRequestsChunks.map(chunk => {
        return dynamoDb.batchWrite({
          RequestItems: {
            [this.tableName]: chunk,
          },
        }).promise()
      })).then(allResponses => {
        let unprocessedItems = [];
        for (const response of allResponses) {
          if (response.UnprocessedItems && Object.keys(response.UnprocessedItems).length > 0) {
            unprocessedItems = unprocessedItems.concat(
              response.UnprocessedItems[this.tableName].map(item => item.PutRequest.Item)
            );
          }
        }
        if (unprocessedItems.length > 0) {
          reject({
            unprocessedItems,
          })
        } else {
          resolve(allResponses);
        }
      }).catch(error => {
        reject({
          error,
        })
      })
    });
  }

  async guaranteedBatchWrite(records, args = {}) {
    let unprocessedItems = records;
    let error = null;

    while (unprocessedItems.length > 0 && error === null) {
      await this.batchWrite(unprocessedItems, args)
        .then(() => {
          unprocessedItems = []
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
    })
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

      const operator = isObject ? (value.operator || '=') : '=';
      let finalValue = isObject ? value.value : value;

      if (key != "exclusiveStartKey")
        if (index && (key === index.hash || key === index.range)) {
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
      TableName: this.tableName,
    }

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

    if (opts.limit)
      params["Limit"] = opts.limit

    if (opts.paginated)
      params["Paginated"] = opts.paginated

    if (args.exclusiveStartKey)
      params["ExclusiveStartKey"] = args.exclusiveStartKey

    return params;
  }
}

const divideArrayInChunks = (array, chunkSize) => {
  return array.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / chunkSize)

    if(!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].push(item)

    return resultArray
  }, [])
}

module.exports = DynamoDB;
