/*
 * Loon 脚本：联通超级星期五话费抢购（修复$arguments未定义问题）
 * 适配配置传递的参数：cookie（手动输入的Cookie）、domain（活动域名）
 */

function main() {
    // 1. 用Loon标准变量$argument读取配置传递的参数（键值对格式：cookie=xxx&domain=xxx）
    const paramStr = $argument || ""; // 关键修改：$argument（单数），而非$arguments
    let config = {
        cookie: "",
        domain: "m.client.10010.com", // 默认域名，配置可覆盖
        apiPath: "/api/activity/super-friday/buy" // 需替换为抓包的真实抢购接口路径
    };

    // 2. 解析参数（按“&”分割键值对，按“=”分割键和值）
    if (paramStr.trim()) {
        paramStr.split("&").forEach(pair => {
            const [key, value] = pair.split("=").map(item => decodeURIComponent(item.trim()));
            if (key === "cookie" && value) config.cookie = value; // 匹配配置传递的“cookie”键
            if (key === "domain" && value) config.domain = value; // 匹配配置传递的“domain”键
        });
    }

    // 3. 校验必填参数（Cookie不能为空）
    if (!config.cookie.trim()) {
        const errMsg = "请在配置中填写联通活动Cookie！";
        console.error(errMsg);
        $notification.post("抢购失败", "参数缺失", errMsg);
        $done();
        return;
    }

    // 4. 构造抢购请求（Loon标准$httpClient格式）
    const requestConfig = {
        url: `https://${config.domain}${config.apiPath}`,
        headers: {
            "Host": config.domain,
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": config.cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.37 NetType/WIFI Language/zh_CN"
        },
        body: `cookie=${encodeURIComponent(config.cookie)}&page=1&id=1&buyType=phone_fee`
    };

    // 5. 发送POST请求
    $httpClient.post(requestConfig, (error, response, data) => {
        if (error) {
            const errInfo = `网络错误：${error.message}`;
            console.error("抢购失败:", errInfo);
            $notification.post("联通抢购失败", "请求异常", errInfo);
        } else {
            const status = response.statusCode;
            let title = "抢购结果", content;
            if (status === 200 && data.includes("success")) {
                title = "🎉 抢购成功";
                content = "话费抢购请求提交成功！请前往APP确认";
            } else if (status === 401) {
                content = "⚠️ Cookie已过期，请更新配置中的Cookie";
            } else {
                content = `❌ 失败（状态码：${status}），响应：${data.slice(0, 100)}`;
            }
            console.log(title + ":", content);
            $notification.post(title, "", content);
        }
        $done(); // Loon脚本必须调用$done()结束
    });
}

main();