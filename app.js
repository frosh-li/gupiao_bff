// app.js
// 引入 events 模块
const events = require('events');
// 创建 eventEmitter 对象
const eventEmitter = new events.EventEmitter();
const fork = require('child_process').fork;
const maxProcess = 10;
const fs = require('fs');
const moment = require('moment');

/**
 * 检查是否在开盘时间内
 */
function checkOnTimer() {
  const hours = moment().hours();
  const minute = moment().minute();
  console.log('当前时间', hours, '时', minute, '分');
  if(
    (hours === 9 && minute >= 30) //9点30正式开盘
    ||
    (hours === 10)
    ||
    (hours === 11 && minute <= 30)
    ||
    (hours >= 13 && hours < 15)
   ) {
     return true;
   }
  return false;
}

module.exports = app => {
  // 注意，只有在 egg-ready 事件拿到之后才能发送消息
  
  app.messenger.once('egg-ready', () => {
    app.messenger.on('action_start_realtime', async data => {
      
      const subs = {};
      const processes = {}
      for(let i = 0 ; i < maxProcess ; i++) {
        let child = fork('./sub.js');
        child.on('message', (msg) => {
          if(msg.status === 'free') {
            subs[msg.pid] = {
              status: msg.status,
              child: child,
            };
            if(msg.resMessage) {
              for (let key in app.io.sockets.sockets) {
                let socket  = app.io.sockets.sockets[key];
                socket && socket.emit('realtime', msg.resMessage);
                // socket.send(JSON.stringify(['realtime', JSON.stringify(msg.resMessage)]))
              }
            }
            
            if(!processes[msg.pid]) {
              processes[msg.pid] = child;
            }
          }
          if(msg.status === 'busy') {
            subs[msg.pid] = {
              status: msg.status,
              child: child,
            };
          }
        })
      }
      const { Stock, Single } = app.model;

      let mainStocks = [];
      // 获取换手率6%以上的股票
      let counts = 0;
      eventEmitter.on('request:done', function(code) { 
        counts++;
        if(counts.length === mainStocks.length) {
          // 所有的结束
          console.log('开始下一轮数据抓取');
          counts = 0;
          setTimeout(() => {
            const tmpStocks = [...mainStocks];
            realtime(tmpStocks);
          }, 60000);
        }
      }); 

      const res = await Stock.find({turnover_rate: {$gte: 4}});
      const ret = await res;
      const stocks = ret.map(item => ({
        Code: item.symbol.substring(2), 
        Name: item.symbol,
        market_capital: item.market_capital,
      }));
      // console.log('stocks', stocks)
      mainStocks = [...stocks];
      console.log('总数量为', stocks.length);
      setTimeout(function() {
        if(checkOnTimer()) {
            startFork(stocks);
        }else{
          console.log('没到开盘时间');
          setTimeout(arguments.callee,1000);
        }
      }, 1000)

      

      function startFork(stocks) {
        if(stocks.length === 0) {
          console.log('本轮已经结束');
          setTimeout(function() {
            if(checkOnTimer()) {
                startFork([...mainStocks]);
            }else{
              console.log('没到开盘时间');
              setTimeout(arguments.callee,60000);
            }
          }, 60000)
          return;
        }
        for(let key in subs) {
          if(subs[key].status === 'free') {
            const stock = stocks.shift();
            if(!stock) {
              break;
            }
            processes[key].send({...stock});
            break;
          }
        }
        setTimeout(() => {
          startFork(stocks);
        }, 10);
      }
    });
  })
}