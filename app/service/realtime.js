"use strict";
const rp = require('request-promise-native');
const moment = require('moment');
const Service = require("egg").Service;
/**
 * 真实抓取流程
 */
class RealtimeService extends Service {
  constructor(ctx) {
    super(ctx);
  }
}

module.exports = RealtimeService;
