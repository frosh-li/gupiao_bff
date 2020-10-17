'use strict';

module.exports = app => {
  class Controller extends app.Controller {
    /**
     * 开始数据抓取
     */
    async start() {

      const { ctx } = this;
      const { Stock, Single } = ctx.model;
     
      try{
        await ctx.service.realtime.start();
        this.ctx.socket.emit('res', 'success');
      }catch(e) {
        console.log(e)
      }
    }
  
  }
  return Controller;
};