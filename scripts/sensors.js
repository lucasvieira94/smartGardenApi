const awsIot = require('aws-iot-device-sdk')

const {
  privateKey,
  clientCert,
  caCert,
  clientId,
  host
} = require('minimist')(process.argv.slice(2))

const device = awsIot.device({
  // keyPath: privateKey,
  // certPath: clientCert,
  // caPath: caCert,
  clientId: clientId,
  host: host
})

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const startScript = async () => {
  while (true) {
    device.on('connect', function() {
      console.log('connect')
      device.subscribe('smartGarden/topics/PlantDevice')
      device.publish('smartGarden/topics/PlantDevice', JSON.stringify({ test_data: 1}))
    })

    device.on('message', function(topic, payload) {
      console.log('message', topic, payload.toString())
    })

    sleep(5000)
  }
}

startScript()
