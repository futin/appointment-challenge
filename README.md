
#  Appointment Challenge

> Implementation for appointment challenge

## Install

Please run the "install" command first:

```sh
$ npm install
```

This will install all of the required dependencies, as stated in `package.json`file.


## How to use ?


To start the server, run:

```sh
$ npm run start
```

In order to see all the logs as well, run:

```sh
$ DEBUG=appointment-challenge:* npm run start
```

If you don't have local mongodb setup, you can use remote mongodb instance:

```sh
$ MONGO_MODE=remote npm run start
```

This way, all collections will be created on remote mongodb instance which is hosted by [MongoLab](https://mlab.com).

## Clean-up

There are also couple of clean-up scripts, which basically wipes whole database created by the project.

In order to clean-up local mongodb database, run:

```sh
$ npm run drop-db-local
```

And in order to clean-up remote mongodb database, run:

```sh
$ npm run drop-db-remote
```
