/*
 * Loon 环境脚本：联通超级星期五话费抢购（支持手动输入Cookie+活动域名）
 * 依赖配置参数：unicom_cookie（手动输入的Cookie）、unicom_domain（手动输入的活动域名）
 */

function main() {
    // 1. 从Loon配置参数中读取手动输入的Cookie和活动域名
    // （参数名需与配置文件中argument的键一致：unicom_cookie、unicom_domain）
    const manualCookie = $argument.get("unicom_cookie") || ""; // 读取手动输入的Cookie，默认空
    const manualDomain = $argument.get("unicom_domain") || "m.client.10010.com"; // 读取活动域名，默认联通常用域名
    
    // 2. 校验核心参数（Cookie和域名不能为空，否则提示错误）
    if (!manualCookie) {
        const errMsg = "请先在配置参数中填写「联通活动Cookie」！";
        console.error(errMsg);
        $notification.post("联通抢购失败", "参数缺失", errMsg);
        $done();
        return;
    }
    if (!manualDomain) {
        const errMsg = "请先在配置参数中填写「联通活动域名」！";
        console.error(errMsg);
        $notification.post("联通抢购失败", "参数缺失", errMsg);
        $done();
        return;
    }

    // 3. 动态配置请求参数（用手动输入的域名和Cookie替换固定值）
    const requestParams = {
        // 拼接完整接口URL（需根据联通抢购实际接口路径修改，此处为通用示例）
        url: `https://${manualDomain}/api/activity/super-friday/buy`, 
        headers: {
            "Host": manualDomain, // 请求头Host与活动域名一致（Loon建议显式指定）
            "Content-Type": "application/x-www-form-urlencoded", // 表单编码格式（适配POST表单参数）
            "Cookie": manualCookie, // 直接使用手动输入的Cookie（无需重复编码，配置中已填写完整Cookie）
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.37(0x18002527) NetType/WIFI Language/zh_CN" // 模拟手机微信环境（可选，适配活动接口限制）
        },
        // 4. 构造请求体（根据抢购接口实际参数调整，page、id为示例，需与活动接口匹配）
        body: `cookie=${encodeURIComponent(manualCookie)}&page=1&id=1&buyType=phone_fee` 
        // 注：若接口要求Cookie仅在请求头传递，可删除body中的cookie参数，仅保留page、id等业务参数
    };

    // 5. 使用Loon内置$httpClient.post发送抢购请求
    $httpClient.post(requestParams, function(error, response, data) {
        if (error) {
            // 6. 处理请求错误（网络问题、接口不可达等）
            const errorInfo = `网络错误：${error.message}`;
            console.error("联通抢购请求失败:", errorInfo);
            $notification.post("联通抢购失败", "请求异常", errorInfo);
        } else {
            // 7. 处理请求响应（根据接口返回内容判断抢购结果，此处为通用逻辑）
            const statusCode = response.statusCode;
            let resultMsg = `状态码：${statusCode}\n响应内容：${data.slice(0, 100)}...`;
            let notifyTitle = "联通抢购结果";

            // 简单判断抢购结果（需根据接口实际返回修改，例：200=成功，401=Cookie失效，500=服务器错误）
            if (statusCode === 200 && data.includes("success") && !data.includes("fail")) {
                notifyTitle = "联通抢购成功";
                resultMsg = "🎉 话费抢购请求提交成功！请前往APP确认订单~";
            } else if (statusCode === 401) {
                notifyTitle = "抢购失败（Cookie失效）";
                resultMsg = "⚠️ Cookie已过期，请重新获取并更新配置参数！";
            } else {
                notifyTitle = "联通抢购失败";
                resultMsg = `❌ 抢购失败，详情：${resultMsg}`;
            }

            console.log(notifyTitle + ":", resultMsg);
            $notification.post(notifyTitle, "", resultMsg); // 发送结果通知
        }
        $done(); // Loon脚本必须调用$done()结束任务
    });
}

// 执行脚本入口函数
main();