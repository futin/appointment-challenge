
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

There are also couple of clean-up scripts, which basically wipe the whole database created by the project.

In order to clean-up local mongodb database, run:

```sh
$ npm run drop-db-local
```

And in order to clean-up remote mongodb database, run:

```sh
$ npm run drop-db-remote
```

## Minor /availability modifications

Beside regular query parameters that must be provided: `begin`, `end` and `duration` I have also added 2 more: `useAllDayEvent` and `showIds`.

These are, of course, optional parameters. Let me explain why I added them.

`useAllDayEvent` - the only valid value for this parameter is 'yes'. If it is provided, in-between requested days will be considered as `whole days`.

Example: 
        
```
GET: /availability?begin=2018-08-12T10:00:00Z&end=2018-08-14T12:00:00Z&duration=30&useAllDayEvent=yes
```

Availability algorithm will then look for these days:

```
begin: 2018-08-12 10:00 end: 2018-08-12 23:59
begin: 2018-08-13 00:00 end: 2018-08-13 23:59
begin: 2018-08-14 00:00 end: 2018-08-14 12:00
```

Otherwise, the days will look like this:

```
begin: 2018-08-12 10:00 end: 2018-08-12 12:00
begin: 2018-08-13 10:00 end: 2018-08-13 12:00
begin: 2018-08-14 10:00 end: 2018-08-14 12:00
```

`showIds` - if provided with 'yes', it will display the doctor/room ids in the response as well, beside `begin`, `end` time. I thought that it might help with testing and debugging.