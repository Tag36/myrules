// 修改小说APP搜索入口接口返回
// 配置方法：
// [rewrite_local]
// ^https:\/\/api\.miaoxiaole\.com\/book\/user\/checkSearchEntrance url script-response-body checkSearchEntrance.js
//
// [mitm]
// hostname = api.miaoxiaole.com


let obj = JSON.parse($response.body);

obj.result = true;

let now = new Date();
now.setHours(20, 0, 0, 0); // 设为当天 20:00:00
let timestampMs = now.getTime();

// 更新 timestamp
obj.timestamp = timestampMs;

$done({ body: JSON.stringify(obj) });