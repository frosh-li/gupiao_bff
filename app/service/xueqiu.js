'use strict';

/**
 * 雪球页面
 */


module.exports = app => {
  class Xueqiu extends app.Service {
    constructor(ctx) {
      super(ctx);
      this.url = 'https://xueqiu.com/service/v5/stock/screener/quote/list?';
      this.params = {
          page: 1,
          size: 30,
          order: 'desc',
          orderby: 'percent',
          order_by: 'percent',
          market: 'CN',
          type: 'sh_sz',
          _: +new Date()
      };
    }

    getUrl() {
        return `${this.url}${this.buildParams()}`;
    }

    buildParams() {
        let ret = [];
        for (let key in this.params) {
            ret.push(`${key}=${this.params[key]}`);
        }
        return ret.join('&');
    }

    nextPage() {
        this.params.page++;
    }

    getUrlByPage(page) {
        this.params.page = page;
        return `${this.url}${this.buildParams()}`;
    }

    resetPage() {
        this.params.page = 1;
    }
  }
  return Xueqiu;
};