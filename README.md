## Andrew API

This repository contains the code related to the Andrew Insurance product

## API documentation

[postman collection online](https://documenter.getpostman.com/view/13953520/2s9YeHbrPg#intro)
[postman collection download](./doc/andrew-api.postman_collection.json)

## Roles

- superadmin:
  - devices WRITE + DELETE
  - all below roles

## Test users and roles

- elliot.billie@yopmail.com - superadmin

## Quick start

```bash
# install project dependencies
npm install
# lauch developement server
npm run start:dev
```

## Build docker image

```bash
export DOCKER_BUILDKIT=1
docker buildx build --tag=antoineleguillou/andrew-api:v0.1 --no-cache --ssh default=$SSH_AUTH_SOCK -f ./Dockerfile .
```

## Dependencies

- Keycloak: third party authentication server for users and devices
- Kafka broker : for data transmission from mqtt broker to the system (buffer role + shared subscription replacement as mqtt broker is not MQTT 5.0 compliant)
- ELasticsearch database with following topics configured :
  - acl : mappings from vehicles identified by their VIN number to data points comming from andrew devices and to users authorized to access the data.
  - acl_report : reports containing driver behaviour class output from the AI model and driving session start + end
- AI model: Driver behaviour classification model
- Message bus events typings (andrew-events-schemas)
- Oauth2 compatible MQTT broker with roles and topics access grants verfications : for data transmission from andrew devices and the mqtt broker and data transmission from system to mqtt broker relaying it to devices (devices status challenge)
