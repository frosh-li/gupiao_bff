'use strict';

const Controller = require('egg').Controller;

class CrawController extends Controller {
  /**
   * 开始数据抓取
   */
  async start() {
    if(this.app.crawing) {
      return;
    }
    const { ctx } = this;
    const { Stock, Single } = ctx.model;
    await Stock.remove({});
    await Single.remove({});
    try{
      await ctx.service.crawall.startCrawAllStock();
      this.app.crawing = true;
    }catch(e) {
      console.log(e)
    }
  }

}

module.exports = CrawController;