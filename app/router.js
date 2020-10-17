'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, io } = app;
  router.get('/', controller.home.index);

  io.route('chat', app.io.controller.money.index);
  io.route('craw', io.controller.craw.start);
  io.route('realtime', io.controller.realtime.start);

};
