/**
 * 安徽联通周五秒杀 - 多账号自动抓包 & 定时并发版
 * * [rewrite_local]
 * ^https:\/\/ahst\.ahlt10010\.com\/.*lotteryAction url script-request-header 本脚本路径.js
 * * [task_local]
 * 59 59 9,15,16 * * 5 本脚本路径.js, tag=联通多号秒杀, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/10010.png, enabled=true
 */

const scriptName = "联通多号秒杀";
const targetHour = 16;   // ⏰ 设定秒杀小时
const targetMinute = 0;
const targetSecond = 0;
const advanceMs = 200;   // 提前毫秒数

// 存储多账号数据的 Key
const KEY_ACCOUNTS = "AH_UNICOM_ACCOUNTS";
const isRequest = typeof $request !== "undefined";

if (isRequest) {
    GetCookie();
    $done({});
} else {
    waitToTargetTime(RunSeckill);
}

// ===============================
// 1. 抓包逻辑 (自动存入数组，按账号去重)
// ===============================
function GetCookie() {
    if ($request.method === "OPTIONS") return;
    const url = $request.url;

    if (url.indexOf("lotteryAction") > -1) {
        // 读取已保存的账号数组
        let accounts = [];
        try {
            accounts = JSON.parse($prefs.valueForKey(KEY_ACCOUNTS) || "[]");
        } catch (e) {
            accounts = [];
        }

        const headers = $request.headers;
        
        // 尝试提取唯一标识 (优先提 Referer 里的 userNumber 手机号，提取不到则用 ticket)
        let referer = headers['Referer'] || headers['referer'] || "";
        let phoneMatch = referer.match(/userNumber=(\d{11})/);
        let ticketMatch = url.match(/ticket=([^&]+)/);
        
        let uid = phoneMatch ? phoneMatch[1] : (ticketMatch ? ticketMatch[1] : "未知账号");

        // 查找该账号是否已经存在
        let existingIndex = accounts.findIndex(acc => acc.uid === uid);

        if (existingIndex !== -1) {
            // 已存在，更新最新抓到的 URL 和 Headers (保持 ticket 最新)
            accounts[existingIndex].url = url;
            accounts[existingIndex].headers = headers;
            console.log(`[${scriptName}] 更新账号数据 UID: ${uid}`);
            $notify(scriptName, `🔄 账号 ${existingIndex + 1} 更新成功`, `已更新账号 ${uid} 的凭证`);
        } else {
            // 不存在，新增账号
            accounts.push({
                uid: uid,
                url: url,
                headers: headers
            });
            console.log(`[${scriptName}] 新增账号数据 UID: ${uid}`);
            $notify(scriptName, `✅ 新增账号 ${accounts.length}`, `已保存账号 ${uid} 的凭证\n若需添加更多账号，请切换联通账号后刷新活动页`);
        }

        // 保存回 Quantumult X 本地存储
        $prefs.setValueForKey(JSON.stringify(accounts), KEY_ACCOUNTS);
    }
}

// ===============================
// 2. 并发秒杀逻辑
// ===============================
function RunSeckill() {
    let accounts = [];
    try {
        accounts = JSON.parse($prefs.valueForKey(KEY_ACCOUNTS) || "[]");
    } catch (e) {
        accounts = [];
    }

    if (accounts.length === 0) {
        $notify(scriptName, "❌ 执行失败", "未找到任何账号数据，请先去活动页触发抓包");
        $done();
        return;
    }

    console.log(`🚀 开始执行，共检测到 ${accounts.length} 个账号...`);
    let finished = 0;

    accounts.forEach((acc, index) => {
        const req = {
            url: acc.url, // 保持原汁原味的 URL
            method: "POST",
            headers: acc.headers,
            body: "{}"
        };

        // 模糊处理手机号用于日志展示 (139****1234)
        let maskUid = acc.uid.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        let accName = `[账号${index + 1} | ${maskUid}]`;

        $task.fetch(req).then(response => {
            try {
                const result = JSON.parse(response.body);
                console.log(`${accName} 返回: ${response.body}`);
                
                const msg = result.alertMsg || result.message || "无信息";
                const success = result.success || false;
                
                if (success) {
                    $notify(scriptName, `🎉 ${accName} 秒杀成功`, `奖品: ${result.data?.awardName || "未知"} | Msg: ${msg}`);
                } else {
                    console.log(`${accName} 失败 Msg: ${msg}`);
                    // 如果你想失败也弹窗通知，把下面这行取消注释
                    // $notify(scriptName, `😭 ${accName} 失败`, `Msg: ${msg}`);
                }
            } catch (e) {
                console.log(`${accName} 解析错误: ${e}`);
            }
            finished++;
            if (finished === accounts.length) $done();
        }, reason => {
            console.log(`${accName} 请求失败: ${reason.error}`);
            finished++;
            if (finished === accounts.length) $done();
        });
    });
}

// ===============================
// 3. 定时器控制逻辑
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
        console.log("⚠️ 检测到当前非目标时间，立即执行(测试)...");
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
