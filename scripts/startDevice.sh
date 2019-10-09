# stop script on error
set -e

# Check to see if root CA file exists, download if not
if [ ! -f ./root-CA.crt ]; then
  printf "\nDownloading AWS IoT Root CA certificate from AWS...\n"
  curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > root-CA.crt
fi

# run pub/sub sample app using certificates downloaded in package
printf "\nRunning pub/sub sample application...\n"
node sensors.js --host-name=a32s00oqo8wynw-ats.iot.us-east-1.amazonaws.com --private-key=PlantDevice.private.key --client-certificate=PlantDevice.cert.pem --ca-certificate=root-CA.crt --client-id=sdk-nodejs-1496f575-9c99-4ba1-87a1-41a2964f9a9c
