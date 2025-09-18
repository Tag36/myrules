/*
 * Loon 脚本：联通超级星期五话费抢购（适配案例成功模式：数组参数+按索引读取）
 * 参数来源：配置传递的数组 [Cookie, 域名]，脚本按索引读取
 * $argument[0] = Cookie（手动输入的联通活动Cookie）
 * $argument[1] = 域名（手动输入的活动域名，默认m.client.10010.com）
 */

function main() {
    // 1. 按案例模式读取参数（$argument是数组，单数！对应配置中的数组参数）
    const cookie = $argument[0] || ""; // 数组第0位：Cookie（必填）
    const domain = $argument[1] || "m.client.10010.com"; // 数组第1位：域名（默认值兜底）
    const config = {
        cookie: cookie.trim(),
        domain: domain.trim(),
        apiPath: "/api/activity/super-friday/buy" // 【必须修改】抓包获取的真实抢购接口路径
    };

    // 2. 校验必填参数（Cookie不能为空，与案例一致的参数校验逻辑）
    if (!config.cookie) {
        const errMsg = "请在配置「手动输入Cookie」中填写联通活动Cookie！";
        console.error(errMsg);
        $notification.post("联通抢购失败", "参数缺失", errMsg);
        $done();
        return;
    }

    // 3. 构造抢购请求（Loon标准$httpClient格式，与案例脚本规范一致）
    const requestConfig = {
        url: `https://${config.domain}${config.apiPath}`, // 拼接完整接口URL
        headers: {
            "Host": config.domain, // 与域名一致（Loon必配，案例脚本也遵循此规范）
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": config.cookie, // 使用读取到的Cookie
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.37 NetType/WIFI Language/zh_CN"
        },
        // 4. 请求体（按抓包的真实参数修改，page、id仅为示例）
        body: `cookie=${encodeURIComponent(config.cookie)}&page=1&id=1&buyType=phone_fee`
    };

    // 5. 发送POST请求（与案例脚本一致的异步请求逻辑）
    $httpClient.post(requestConfig, function(error, response, data) {
        if (error) {
            // 错误处理（案例脚本也用console+notification双反馈）
            const errorInfo = `网络错误：${error.message}`;
            console.error("抢购请求失败:", errorInfo);
            $notification.post("联通抢购失败", "请求异常", errorInfo);
        } else {
            // 响应处理（按状态码和返回内容判断结果，参考案例的结果判断逻辑）
            const statusCode = response.statusCode;
            let notifyTitle = "联通抢购结果";
            let notifyContent = `状态码：${statusCode}\n响应内容：${data.slice(0, 100)}...`;

            // 适配常见场景（需根据真实接口返回调整，案例也有类似场景判断）
            if (statusCode === 200 && data.includes("success") && !data.includes("fail")) {
                notifyTitle = "🎉 联通抢购成功";
                notifyContent = "话费抢购请求提交成功！请前往联通APP确认订单~";
            } else if (statusCode === 401 || data.includes("token失效") || data.includes("未登录")) {
                notifyTitle = "⚠️ 抢购失败（Cookie失效）";
                notifyContent = "请重新获取联通活动Cookie并更新配置！";
            } else if (statusCode === 404) {
                notifyTitle = "❌ 抢购失败（接口错误）";
                notifyContent = "接口路径错误，请修改脚本中的apiPath参数（抓包获取真实路径）！";
            }

            console.log(notifyTitle + ":", notifyContent);
            $notification.post(notifyTitle, "", notifyContent);
        }
        $done(); // Loon脚本必须调用$done()结束（案例脚本的强制规范）
    });
}

// 执行脚本（案例脚本也用直接调用main()的方式）
main();