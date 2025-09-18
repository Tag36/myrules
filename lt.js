/*
 * Loon 脚本：联通超级星期五话费抢购（支持手动配置Cookie/域名）
 * 配置方式：在Loon脚本页面填写「参数」，格式：cookie=你的Cookie;domain=活动域名
 * 示例参数：cookie=TOKEN=xxx;UID=xxx;domain=m.client.10010.com
 */

function main() {
    // 1. 读取Loon脚本参数（手动输入的Cookie和域名，参数格式：cookie=xxx;domain=xxx）
    const scriptParams = $arguments; // Loon规范：通过$arguments获取脚本参数（字符串）
    let config = {
        cookie: "",
        domain: "m.client.10010.com", // 默认联通活动域名
        apiPath: "/api/activity/super-friday/buy" // 需替换为抓包的真实抢购接口路径
    };

    // 2. 解析参数（分割cookie和domain）
    if (scriptParams && scriptParams.trim() !== "") {
        const paramArr = scriptParams.split(";");
        paramArr.forEach(param => {
            const [key, value] = param.split("=").map(item => item.trim());
            if (key === "cookie" && value) config.cookie = value;
            if (key === "domain" && value) config.domain = value;
        });
    }

    // 3. 校验必填参数（Cookie不能为空）
    if (!config.cookie.trim()) {
        const errMsg = "请在脚本参数中填写Cookie！格式：cookie=你的Cookie;domain=活动域名";
        console.error(errMsg);
        $notification.post("联通抢购失败", "参数缺失", errMsg);
        $done();
        return;
    }

    // 4. 构造抢购请求参数（遵循Loon $httpClient规范）
    const requestConfig = {
        url: `https://${config.domain}${config.apiPath}`, // 完整接口URL
        headers: {
            "Host": config.domain, // 与域名一致（Loon建议显式指定）
            "Content-Type": "application/x-www-form-urlencoded", // 表单编码（适配POST参数）
            "Cookie": config.cookie, // 手动配置的Cookie（身份验证）
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.37 NetType/WIFI Language/zh_CN" // 模拟手机环境
        },
        // 5. 请求体（按抓包的真实参数修改，page、id仅为示例）
        body: `cookie=${encodeURIComponent(config.cookie)}&page=1&id=1&buyType=phone_fee`
    };

    // 6. 发送POST抢购请求（Loon规范：$httpClient.post + 回调函数）
    $httpClient.post(requestConfig, function(error, response, data) {
        if (error) {
            // 7. 处理请求错误（网络问题、接口不可达等）
            const errorInfo = `网络错误：${error.message}`;
            console.error("抢购请求失败:", errorInfo);
            $notification.post("联通抢购失败", "请求异常", errorInfo);
        } else {
            // 8. 处理响应结果（按接口返回判断抢购状态）
            const statusCode = response.statusCode;
            let notifyTitle = "联通抢购结果";
            let notifyContent = `状态码：${statusCode}\n响应内容：${data.slice(0, 100)}...`;

            // 适配常见响应场景（需根据真实接口返回调整判断条件）
            if (statusCode === 200 && data.includes("success") && !data.includes("fail")) {
                notifyTitle = "🎉 联通抢购成功";
                notifyContent = "话费抢购请求提交成功！请前往联通APP确认订单~";
            } else if (statusCode === 401 || data.includes("token失效") || data.includes("未登录")) {
                notifyTitle = "⚠️ 抢购失败（Cookie失效）";
                notifyContent = "请重新获取联通活动Cookie并更新脚本参数！";
            } else if (statusCode === 404) {
                notifyTitle = "❌ 抢购失败（接口错误）";
                notifyContent = "接口路径错误，请检查并修改脚本中的apiPath参数！";
            }

            console.log(notifyTitle + ":", notifyContent);
            $notification.post(notifyTitle, "", notifyContent);
        }
        $done(); // Loon规范：脚本结束必须调用$done()
    });
}

// 执行脚本（Loon规范：入口函数调用）
main();