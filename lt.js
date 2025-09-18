function main() {
    // 1. 按规则从配置传入的参数中读取 Cookie 和 Host
    // 配置中需通过 argument=[{Cookie参数名},{Host参数名}] 传入，脚本用 $argument.参数名 读取
    const cookie = $argument.cookie || ""; // 读取名为“cookie”的参数（必填，配置中需定义对应输入框）
    const host = $argument.host || "123.138.11.116"; // 读取名为“host”的参数（默认值兜底，避免未填写报错）

    // 2. 校验必填参数（Cookie不能为空，否则提示错误并终止脚本）
    if (!cookie.trim()) {
        const errMsg = "请在配置「cookie」参数中填写完整Cookie值！";
        console.error(errMsg);
        $notification.post("请求失败", "参数缺失", errMsg);
        $done(); // 必须调用，标记脚本结束
        return;
    }

    // 3. 配置请求参数（Cookie和Host使用传递的参数，其余保持原有格式）
    const requestParams = {
        url: `http://${host}`, // 用传递的Host拼接完整接口URL（与Host头保持一致）
        headers: {
            "Host": host, // 直接使用传递的Host（遵循Loon显式指定要求）
            "Content-Type": "application/x-www-form-urlencoded" // 保留原有表单编码格式
        },
        // 4. 构造请求体（Cookie使用传递的参数，保留encodeURIComponent处理特殊字符）
        body: `cookie=${encodeURIComponent(cookie)}&page=1&id=1`
    };

    // 5. 发送POST请求（保留原有请求逻辑和结果处理）
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