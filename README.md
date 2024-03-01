## Andrew ECOMMERCE

This repository contains the code related to the Andrew Insurance product

## APIs documentation

[API postman collection online](https://documenter.getpostman.com/view/13953520/2s9YeHbrPg#intro)
[API postman collection download](./doc/andrew-api.postman_collection.json)
[Ecommerce postman collection online](https://documenter.getpostman.com/view/13953520/2s9YsGhDL8)
[Ecommerce postman collection download]()

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
