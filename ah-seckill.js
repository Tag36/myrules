/**
 * 安徽联通周五秒杀 - 多账号自动抓包 & 定时并发版
 * * [rewrite_local]
 * ^https:\/\/ahst\.ahlt10010\.com\/.*lotteryAction url script-request-header ah_seckill.js
 * * [task_local]
 * # 请根据实际秒杀时间修改 cron 表达式 (例如 9点59分59秒 或 16点59分59秒)
 * 59 59 9,15,16 * * 5 ah_seckill.js, tag=联通多号秒杀, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/10010.png, enabled=true
 */

const scriptName = "联通多号秒杀";
const targetHour = 10;   // ⏰ 设定秒杀小时 (根据场次修改为 9, 10, 16 或 17)
const targetMinute = 0;
const targetSecond = 0;
const advanceMs = 200;   // 提前发包的毫秒数 (建议 100-300，抵消网络延迟)

// 本地存储多账号数据的 Key
const KEY_ACCOUNTS = "AH_UNICOM_ACCOUNTS";
const isRequest = typeof $request !== "undefined";

// 判断运行环境：抓包模式 or 定时执行模式
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
    // 排除 OPTIONS 预检请求
    if ($request.method === "OPTIONS") return;
    const url = $request.url;

    // 只要是抽奖/秒杀接口就抓取
    if (url.indexOf("lotteryAction") > -1) {
        let accounts = [];
        try {
            accounts = JSON.parse($prefs.valueForKey(KEY_ACCOUNTS) || "[]");
        } catch (e) {
            accounts = [];
        }

        const headers = $request.headers;
        
        // 提取账号唯一标识 (优先提 Referer 里的手机号，其次用 ticket 的前8位)
        let referer = headers['Referer'] || headers['referer'] || "";
        let phoneMatch = referer.match(/userNumber=(\d{11})/);
        let ticketMatch = url.match(/ticket=([^&]+)/);
        
        let uid = phoneMatch ? phoneMatch[1] : (ticketMatch ? ticketMatch[1].substring(0, 8) + "..." : "未知账号");

        // 查找该账号是否已经存在于本地数组中
        let existingIndex = accounts.findIndex(acc => acc.uid === uid);

        // ⭐ 绝对保持原样：只保存，不做任何 URL 或参数的修改运算
        if (existingIndex !== -1) {
            // 账号存在，更新凭证
            accounts[existingIndex].url = url;
            accounts[existingIndex].headers = headers;
            console.log(`[${scriptName}] 更新账号数据 UID: ${uid}`);
            $notify(scriptName, `🔄 账号 ${existingIndex + 1} 更新成功`, `已更新账号 ${uid} 的最新凭证`);
        } else {
            // 账号不存在，新增记录
            accounts.push({
                uid: uid,
                url: url,
                headers: headers
            });
            console.log(`[${scriptName}] 新增账号数据 UID: ${uid}`);
            $notify(scriptName, `✅ 新增账号 ${accounts.length}`, `已保存账号 ${uid} 的凭证\n需要添加新号请切换联通APP账号后再次刷新`);
        }

        // 存回 QX 本地
        $prefs.setValueForKey(JSON.stringify(accounts), KEY_ACCOUNTS);
    }
}

// ===============================
// 2. 并发秒杀逻辑 (定时触发)
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

    console.log(`🚀 准备执行，共检测到 ${accounts.length} 个账号...`);
    let finished = 0;

    // 并发遍历请求
    accounts.forEach((acc, index) => {
        // 模糊处理手机号用于日志展示安全 (例如 139****1234)
        let maskUid = acc.uid.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        let accName = `[账号${index + 1} | ${maskUid}]`;

        // ⭐ 构造请求：使用完全原生的 URL 和 Headers
        const req = {
            url: acc.url,
            method: "POST",
            headers: acc.headers,
            body: "{}" 
        };

        $task.fetch(req).then(response => {
            try {
                const result = JSON.parse(response.body);
                console.log(`${accName} 返回: ${response.body}`);
                
                const msg = result.alertMsg || result.message || "无信息";
                const success = result.success || false;
                const code = result.statusCode || result.code || "";
                
                if (success) {
                    $notify(scriptName, `🎉 ${accName} 秒杀成功`, `奖品: ${result.data?.awardName || "未知"} | Msg: ${msg}`);
                } else {
                    console.log(`${accName} 失败 | Code: ${code} | Msg: ${msg}`);
                    // 如果遇到 900 非法请求，弹出提醒以供排查
                    if (code == "900" || msg.indexOf("非法") > -1) {
                        $notify(scriptName, `⚠️ ${accName} 失败`, `状态: ${code}\n提示: ${msg}\n说明: Ticket 可能已过期/失效，请确保证凭证是临近秒杀前最新抓取的！`);
                    }
                }
            } catch (e) {
                console.log(`${accName} 返回解析错误: ${response.body}`);
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

    // 计算延迟时间 = 目标时间 - 当前时间 - 提前量
    let delay = target.getTime() - now.getTime() - advanceMs;

    // 如果距离目标时间已经过去超过 1 分钟（-60000ms），说明是手动点击运行测试，直接执行
    if (delay < -60000) {
        console.log(`⚠️ 检测到当前 ${formatTime(now)} 非目标秒杀时间，立即执行(测试模式)...`);
        callback();
        return;
    }

    // 如果刚刚超过目标时间（0 到 -60000ms 之间），说明稍微迟到了，立即补刀执行
    if (delay < 0) {
        console.log(`⚠️ 时间刚过，立即执行! 当前时间: ${formatTime(now)}`);
        callback();
    } else {
        // 正常倒计时等待
        console.log(`⏳ 当前时间 ${formatTime(now)}，等待 ${delay}ms 后执行 (目标 ${targetHour}:${String(targetMinute).padStart(2, '0')}:${String(targetSecond).padStart(2, '0')})`);
        setTimeout(callback, delay);
    }
}
