## Andrew API

This repository contains the code related to the Andrew Insurance product

## API documentation

[postman collection online](https://documenter.getpostman.com/view/13953520/2s9YeHbrPg#intro)
[postman collection download](./doc/andrew-api.postman_collection.json)

## GLobal workflow

- As a superadmin i register devices and flash credentials on the devices firmware (IOT)
- As a new user i create my customer account and i am redirected back to the application logged in
- As a user i create a new subscription application and fill out the required informations and documents
- As a user i submit my subscription application
- As an insurer i validate the subscription application
- As the system i takes informations from the subscription application to register a new contract and it's related vehicles
- As an insurer i check all informations are present and validate finalize the subscription application
- As an insurer i select a device from the available device pool and link the device to a vehicle
- As an insurer i activate the selected/linked device
- As an insurer i send the device to the user address by mail
- As a user i receive the device
- As a user i activate the plug in my device to the obd plug of my vehicle
- As the device i verify the vehicle VIN is valid in the system
- As the system i validate the device from a customer point of view
- As a user, i am now happy i am insured
- As the device i collect vehicle metrics and send them to the system periodically
- As the system i classify the vehicle driver behaviour
- As the system and according to the vehcile driver behaviour classification i grant insurance discount on the user susbscription.

## Roles

- superadmin:
  - devices WRITE + DELETE
  - all below roles
- supervisor:
  - devices READ
  - devices to contract link
  - users READ + WRITE + UPDATE + DELETE
  - contracts READ + WRITE + UPDATE + DELETE
  - vehicles READ + WRITE + UPDATE + DELETE
  - subscription application READ + WRITE + UPDATE + DELETE
- user:
  - devices READ own data
  - contracts READ own data
  - vehicle READ own data
  - susbscription application WRITE + UPDATE

## Test users and roles

- elliot.billie@yopmail.com - superadmin
- jacko@yopmail.com - insurer aka supervisor (keycloak)
- jack.williams@yopmail.com - user
- mike@yopmail.com - user

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
