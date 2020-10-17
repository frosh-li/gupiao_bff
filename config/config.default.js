/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1601181730080_7094';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  config.io = {
    init: {},
    namespace: {
      '/': {
        connectionMiddleware: ['auth'],
        packetMiddleware: ['filter'],
      },
      '/chat': {
        connectionMiddleware: ['auth'],
        packetMiddleware: [],
      }
    },
    redis: {
      host: '127.0.0.1',
      port: 6379
    }
  }
  config.mongoose = {
    client: {
      url: 'mongodb://localhost:27017/stocks',
      options: {useUnifiedTopology: true},
      // mongoose global plugins, expected a function or an array of function and options
      plugins: [],
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
