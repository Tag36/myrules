/**
 * 安徽联通周五秒杀 - 多账号自动抓包 & 定时并发版
 * * [rewrite_local]
 * ^https:\/\/ahst\.ahlt10010\.com\/.*lotteryAction url script-request-header ah_seckill.js
 * * [task_local]
 * 59 59 9,15,16 * * 5 ah_seckill.js, tag=联通多号秒杀, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/10010.png, enabled=true
 */

const scriptName = "联通多号秒杀";
const targetHour = 10;   // ⏰ 设定秒杀小时 (根据场次修改为 9, 10, 16 或 17)
const targetMinute = 0;
const targetSecond = 0;
const advanceMs = 200;   // 提前发包的毫秒数 

const KEY_ACCOUNTS = "AH_UNICOM_ACCOUNTS";
const isRequest = typeof $request !== "undefined";

if (isRequest) {
    GetCookie();
    $done({});
} else {
    waitToTargetTime(RunSeckill);
}

// ===============================
// 1. 抓包逻辑 (多账号自动识别保存)
// ===============================
function GetCookie() {
    if ($request.method === "OPTIONS") return;
    const url = $request.url;

    if (url.indexOf("lotteryAction") > -1) {
        let accounts = [];
        try { accounts = JSON.parse($prefs.valueForKey(KEY_ACCOUNTS) || "[]"); } catch (e) { accounts = []; }

        const headers = $request.headers;
        let referer = headers['Referer'] || headers['referer'] || "";
        let phoneMatch = referer.match(/userNumber=(\d{11})/);
        let ticketMatch = url.match(/ticket=([^&]+)/);
        let uid = phoneMatch ? phoneMatch[1] : (ticketMatch ? ticketMatch[1].substring(0, 8) + "..." : "未知账号");

        let existingIndex = accounts.findIndex(acc => acc.uid === uid);

        if (existingIndex !== -1) {
            accounts[existingIndex].url = url;
            accounts[existingIndex].headers = headers;
            console.log(`[${scriptName}] 🔄 更新账号凭证: ${uid}`);
            $notify(scriptName, `🔄 账号更新成功`, `已更新账号 ${uid} 的最新凭证`);
        } else {
            accounts.push({ uid: uid, url: url, headers: headers });
            console.log(`[${scriptName}] ✅ 新增账号数据: ${uid}`);
            $notify(scriptName, `✅ 新增账号 ${accounts.length}`, `已保存账号 ${uid} 的凭证`);
        }
        $prefs.setValueForKey(JSON.stringify(accounts), KEY_ACCOUNTS);
    }
}

// ===============================
// 2. 并发秒杀逻辑 (定时触发)
// ===============================
function RunSeckill() {
    let accounts = [];
    try { accounts = JSON.parse($prefs.valueForKey(KEY_ACCOUNTS) || "[]"); } catch (e) { accounts = []; }

    if (accounts.length === 0) {
        console.log(`❌ 未找到账号数据`);
        $done();
        return;
    }

    console.log(`🚀 开始执行，共 ${accounts.length} 个账号...`);
    let finished = 0;

    accounts.forEach((acc, index) => {
        let maskUid = acc.uid.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        let accName = `[账号${index + 1} | ${maskUid}]`;

        const req = {
            url: acc.url,
            method: "POST",
            headers: acc.headers,
            body: "{}" 
        };

        // 记录发起请求的精准时间戳
        let startTime = new Date();
        let startStr = formatTime(startTime);

        $task.fetch(req).then(response => {
            // 计算耗时
            let endTime = new Date();
            let costMs = endTime.getTime() - startTime.getTime();

            try {
                const result = JSON.parse(response.body);
                const msg = result.alertMsg || result.message || "无信息";
                const success = result.success || false;
                const code = result.statusCode || result.code || "";
                
                // ⭐ 附带时间和耗时的日志
                if (success) {
                    const prize = result.data?.awardName || "未知";
                    console.log(`[${startStr}] ${accName} 🎉 成功 | 耗时: ${costMs}ms | 奖品: ${prize} | 提示: ${msg}`);
                    $notify(scriptName, `🎉 ${accName} 秒杀成功`, `耗时: ${costMs}ms | 奖品: ${prize}\n提示: ${msg}`);
                } else {
                    console.log(`[${startStr}] ${accName} 🚫 失败 | 耗时: ${costMs}ms | 状态: ${code} | 提示: ${msg}`);
                    if (code == "900" || msg.indexOf("非法") > -1) {
                        $notify(scriptName, `⚠️ ${accName} 凭证失效`, `提示: ${msg}\n请确保在秒杀前 1-2 分钟内抓取！`);
                    }
                }
            } catch (e) {
                console.log(`[${startStr}] ${accName} ⚠️ 解析异常 | 耗时: ${costMs}ms | 原始返回: ${response.body}`);
            }
            
            finished++;
            if (finished === accounts.length) $done();
            
        }, reason => {
            let endTime = new Date();
            let costMs = endTime.getTime() - startTime.getTime();
            console.log(`[${startStr}] ${accName} ❌ 请求出错 | 耗时: ${costMs}ms | 错误: ${reason.error}`);
            
            finished++;
            if (finished === accounts.length) $done();
        });
    });
}

// ===============================
// 3. 定时器精准控制逻辑
// ===============================
function formatTime(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, '0')}`;
}

function waitToTargetTime(callback) {
    const now = new Date();
    const target = new Date(now);
    target.setHours(targetHour, targetMinute, targetSecond, 0);

    let delay = target.getTime() - now.getTime() - advanceMs;

    if (delay < -60000) {
        callback();
        return;
    }

    if (delay < 0) {
        console.log(`⚠️ 立即执行! 当前时间: ${formatTime(now)}`);
        callback();
    } else {
        console.log(`⏳ 当前时间 ${formatTime(now)}，等待 ${delay}ms...`);
        setTimeout(callback, delay);
    }
}
