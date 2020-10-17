"use strict";
const rp = require('request-promise-native');
const moment = require('moment');
const Service = require("egg").Service;
/**
 * 真实抓取流程
 */
class CrawAllService extends Service {
  constructor(ctx) {
    super(ctx);
    this.total = 0;
    this.headers = {
      'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
      Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'cache-control': 'max-age=0',
      Connection: 'keep-alive',
      Referer: 'https://xueqiu.com/hq',
      Host: 'xueqiu.com',
      'Upgrade-Insecure-Requests': 1
    };
    this.cookiejar = null;
  }

  async startCrawAllStock() {
    const { xueqiu } = this.ctx.service;
    console.log(`开始抓取第${xueqiu.params.page}页`);
    this.ctx.socket.emit("step", xueqiu.params.page);
    const url = xueqiu.getUrl();
    let options = {
      uri: url,
      method: 'get',
      dataType: "json",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
        Connection: "keep-alive",
        Cookie:
          "device_id=c86dc338ed7bef666ee643eed3b96e3b; s=dz16deykcw; aliyungf_tc=AQAAADnbY1HU1A0AwLgicy9Nm13OMtYt; xq_a_token=1cc984adc2303728559a6e27619a64e70cc9595c; xq_a_token.sig=98ueT2_mrb1JCknQpk_31plcb4U; xq_r_token=4ec1b5e304a99d5775bfe43683b99aa1e0a3cb7b; xq_r_token.sig=3HywtnqINhq1Y7nGeqmDicJpZp8; u=261559827698299; Hm_lvt_1db88642e346389874251b5a1eded6e3=1559827698; Hm_lpvt_1db88642e346389874251b5a1eded6e3=1559829127",
        Referer: "https://xueqiu.com/hq",
        Host: "xueqiu.com",
        "X-Requested-With": "XMLHttpRequest",
      },
      gzip: true,
    };
    let body = await this.ctx.curl(url, options);
    if (body.data.error_code !== 0) {
      console.log("request error", url, body);
    } else {
      this.save(body.data.data.list);
    }
  }

  async save(data) {
    const { Stock, Single } = this.ctx.model;
    console.log(data);
    if (data.length === 0) {
      console.log("all stocks", this.allStocks);
      this.CrawSingle();
      return;
    }
    data = data.map((item) => {
      return {
        ...item,
        symbol: item.symbol,
        name: item.name,
      };
    });
    await Stock.insertMany(data);
    const { xueqiu } = this.ctx.service;
    xueqiu.nextPage();
    this.startCrawAllStock();
  }

  async CrawSingle() {
    const { Stock, Single } = this.ctx.model;
    const data = await Stock.find({});
    this.total = data.length;
    this.RunCraw(data);
  }

  async RunCraw(data) {
    this.cookiejar = rp.jar();
    let res = await rp({
      uri: "https://stock.xueqiu.com",
      resolveWithFullResponse: true, //  <---  <---  <---  <---
      headers: this.headers,
      gzip: true,
      jar: this.cookiejar,
    });
    console.log(res.headers["set-cookie"]);
    this.headers["Host"] = "stock.xueqiu.com";
    this.headers.Cookie =
      "device_id=c86dc338ed7bef666ee643eed3b96e3b; s=dz16deykcw;" +
      this.cookiejar.getCookieString("https://stock.xueqiu.com");
    console.log(this.cookiejar.getCookieString("https://stock.xueqiu.com"));
    // return;
    delete this.headers.Referer;
    console.log(this.headers);

    this.startCraw(data);
  }

  async startCraw(data) {
    const { Stock, Single } = this.ctx.model;
    let item = data.shift();
    if (!item) {
      console.log("所有的爬取结束");
      this.app.crawing = false;
      return;
    }
    console.log("start at", item.symbol);
    this.ctx.socket.emit('step', `${this.total - data.length}/${this.total}`);

    let today = +moment()
      .add(1, "day")
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0);
    let url = `https://stock.xueqiu.com/v5/stock/chart/kline.json?symbol=${item.symbol}&begin=${today}&period=day&type=before&count=-100&indicator=kline`;
    let options = {
      uri: url,
      json: true,
      headers: this.headers,
      //   resolveWithFullResponse: true,
      gzip: true,
      jar: this.cookiejar,
    };
    console.log(url);
    let body;
    try {
      body = await rp(options);
    } catch (e) {
      console.log("获取数据出错，重试");
      body = await rp(options);
    }
    this.headers.Cookie =
      "device_id=c86dc338ed7bef666ee643eed3b96e3b; s=dz16deykcw;" +
      this.cookiejar.getCookieString("https://stock.xueqiu.com");
    if (body) {
    
      var tmp1 = [];
      body.data.item.forEach((citem) => {
        tmp1.push({
          symbol: body.data.symbol,
          timestamp: citem[0],
          vol: citem[1],
          open: citem[2],
          high: citem[3],
          low: citem[4],
          close: citem[5],
          percent: citem[7],
          pb: citem[13],
          turnoverrate: citem[8], // 换手率
        });
      });
      console.log(body.data.symbol, "获取记录数", tmp1.length);
      await Single.insertMany(tmp1);
      console.log("插入成功", body.data.symbol);
    }
    setTimeout(() => {
      this.startCraw(data);
    }, 10);
  }
}

module.exports = CrawAllService;
