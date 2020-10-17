'use strict';

module.exports = app => {
  class Controller extends app.Controller {
    /**
     * 开始数据抓取
     */
    async start() {
      if(this.app.crawing) {
        this.ctx.socket.emit('res', 'crawing');
        return;
      }
      const { ctx } = this;
      const { Stock, Single } = ctx.model;
      await Stock.remove({});
      await Single.remove({});
      try{
        await ctx.service.crawall.startCrawAllStock();
        this.app.crawing = true;
        this.ctx.socket.emit('res', 'success');
      }catch(e) {
        console.log(e)
      }
    }
  
  }
  return Controller;
};