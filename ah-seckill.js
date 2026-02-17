/**
 * 安徽联通周五秒杀 - 自动抓包 & 定时执行版
 * * [rewrite_local]
 * ^https:\/\/ahst\.ahlt10010\.com\/.*lotteryAction url script-request-header 本脚本路径.js
 * * [task_local]
 * # 注意：秒杀前请先去 App 里的活动页面手动刷新一下，触发抓包成功提示
 * 59 59 9,16 * * 5 本脚本路径.js, tag=联通秒杀, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/10010.png, enabled=true
 */

const scriptName = "安徽联通秒杀";
const targetHour = 17;   // ⏰ 设定秒杀小时 (例如 10点 或 17点)
const targetMinute = 0;
const targetSecond = 0;
const advanceMs = 300;   // 提前毫秒数

// 存储 Key
const KEY_URL = "AH_UNICOM_URL";
const KEY_HEADER = "AH_UNICOM_HEADER";

// 判断运行环境
const isRequest = typeof $request !== "undefined";

// ===============================
// 模式 A: 抓包 (Rewrite)
// ===============================
if (isRequest) {
    GetCookie();
    $done({});
} 
// ===============================
// 模式 B: 执行 (Task)
// ===============================
else {
    waitToTargetTime(RunSeckill);
}

// ------------------------------------------
// 方法定义
// ------------------------------------------

function GetCookie() {
    // 排除 OPTIONS 请求
    if ($request.method === "OPTIONS") return;

    const url = $request.url;
    // 简单校验是否是抽奖/秒杀接口
    if (url.indexOf("lotteryAction") > -1) {
        // 保存 URL
        const oldUrl = $prefs.valueForKey(KEY_URL);
        if (oldUrl !== url) {
            $prefs.setValueForKey(url, KEY_URL);
            
            // 保存 Headers (转为字符串存储)
            // 这一点很重要，因为包含了 Cookie 和 Referer
            $prefs.setValueForKey(JSON.stringify($request.headers), KEY_HEADER);
            
            console.log(`[${scriptName}] URL captured: ${url}`);
            $notify(scriptName, "✅ 抓取成功", "活动 URL 和 Headers 已保存，请勿频繁刷新以免被覆盖");
        }
    }
}

function RunSeckill() {
    const savedUrl = $prefs.valueForKey(KEY_URL);
    const savedHeadersStr = $prefs.valueForKey(KEY_HEADER);

    if (!savedUrl) {
        console.log(`❌ 未找到保存的 URL，请先去 App 活动页面触发抓包`);
        $notify(scriptName, "执行失败", "未找到 URL，请先运行抓包");
        $done();
        return;
    }

    let headers = {};
    if (savedHeadersStr) {
        try {
            headers = JSON.parse(savedHeadersStr);
        } catch (e) {
            console.log("Headers 解析失败，使用默认");
        }
    }

    // ⭐ 智能处理: 更新 URL 中的 time 参数为当前时间
    // 防止服务器校验 time 参数导致 "请求过期"
    let currentTimestamp = new Date().getTime();
    let finalUrl = savedUrl.replace(/time=\d+/, `time=${currentTimestamp}`);

    // 如果 URL 里没有 time 参数，尝试追加（视具体接口逻辑而定，通常替换即可）
    
    // 构造请求
    const req = {
        url: finalUrl,
        method: "POST", // 大概率是 POST
        headers: headers, // 使用抓取到的 Headers (含 Cookie)
        body: "{}" // 大多数联通活动 body 为空 JSON
    };

    console.log(`🚀 发起请求...`);
    
    $task.fetch(req).then(response => {
        try {
            const result = JSON.parse(response.body);
            const msg = result.alertMsg || result.message || "无信息";
            const success = result.success || false;
            
            console.log(`结果: ${response.body}`);
            
            if (success) {
                $notify(scriptName, "🎉 秒杀成功", `奖品: ${result.data?.awardName || "未知"} | Msg: ${msg}`);
            } else {
                $notify(scriptName, "😭 秒杀失败", `Msg: ${msg}`);
            }
        } catch (e) {
            console.log(`解析错误: ${e}`);
            $notify(scriptName, "⚠️ 异常", "返回数据解析失败");
        }
        $done();
    }, reason => {
        console.log(`请求失败: ${reason.error}`);
        $notify(scriptName, "❌ 网络错误", reason.error);
        $done();
    });
}

// ------------------------------------------
// 时间控制逻辑
// ------------------------------------------
function formatTime(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, '0')}`;
}

function waitToTargetTime(callback) {
    const now = new Date();
    const target = new Date(now);
    target.setHours(targetHour, targetMinute, targetSecond, 0);

    let delay = target.getTime() - now.getTime() - advanceMs;

    // 如果当前时间已经晚于目标时间超过 1 分钟，说明是测试运行，直接执行
    if (delay < -60000) {
        console.log("⚠️ 检测到当前非目标时间，立即执行(测试模式)...");
        callback();
        return;
    }

    if (delay < 0) {
        console.log("⚠️ 时间刚过，立即执行!");
        callback();
    } else {
        console.log(`⏳ 等待 ${delay}ms 后执行 (目标 ${targetHour}:${targetMinute}:${targetSecond})`);
        setTimeout(callback, delay);
    }
}
