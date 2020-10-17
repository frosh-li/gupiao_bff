// agent.js
module.exports = agent => {
  // 在这里写你的初始化逻辑

  // 也可以通过 messenger 对象发送消息给 App Worker
  // 但需要等待 App Worker 启动成功后才能发送，不然很可能丢失
  agent.messenger.on('egg-ready', () => {
    setTimeout(() => {
      console.log('2秒后开始爬去实时数据'); 
      agent.messenger.sendRandom('action_start_realtime', '');
    }, 2000)
    
  });
};