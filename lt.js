function main() {
    // 1. 从配置传入的参数中，按名称读取Cookie和Host（适配 $argument.参数名 规则）
    // 配置中argument数组需包含 {Cookie-manual}（Cookie参数）和 {Host-manual}（Host参数）
    const configCookie = $argument.Cookie_manual || ""; // 读取名称为Cookie_manual的参数（注意：配置中参数名含“-”时，脚本中需转为“_”）
    const configHost = $argument.Host_manual || "123.138.11.116"; // 读取名称为Host_manual的参数，默认值兜底

    // 2. 校验必填参数（Cookie不能为空）
    if (!configCookie.trim()) {
        const errMsg = "请在配置「Cookie-manual」参数中填写有效的Cookie！";
        console.error(errMsg);
        $notification.post("请求失败", "参数缺失", errMsg);
        $done();
        return;
    }

    // 3. 配置请求参数（Cookie和Host使用传递的参数，其余保留原有逻辑）
    const requestParams = {
        url: `http://${configHost}`, // 用传递的Host拼接完整接口URL（与Host头一致）
        headers: {
            "Host": configHost, // 直接使用传递的Host（Loon建议显式指定）
            "Content-Type": "application/x-www-form-urlencoded" // 保留原有表单编码格式
        },
        // 4. 构造请求体（Cookie使用传递的参数，自动处理特殊字符）
        body: `cookie=${encodeURIComponent(configCookie)}&page=1&id=1`
    };

    // 5. 发送POST请求（保留原有请求逻辑）
    $httpClient.post(requestParams, function(error, response, data) {
        if (error) {
            console.error("Fetch error:", error);
            $notification.post("请求失败", "错误信息", error.message);
        } else {
            console.log("Response status:", response.statusCode);
            console.log("Response text:", data);
            $notification.post("请求成功", `状态码: ${response.statusCode}`, `响应内容: ${data.slice(0, 100)}...`);
        }
        $done(); // Loon脚本必须调用$done()结束任务
    });
}

// 执行脚本入口
main();