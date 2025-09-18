/*
 * Loon 环境脚本：发送 POST 请求（带 Cookie、page、id 参数）
 */


function main() {
    // 1. 配置请求参数（适配 Loon $httpClient 格式）
    const requestParams = {
        url: "http://123.138.11.116", // 目标接口，必须带协议（http/https）
        headers: {
            "Host": "123.138.11.116", // 与 URL 主机一致（Loon 建议显式指定）
            "Content-Type": "application/x-www-form-urlencoded" // 表单编码格式
        },
        // 2. 构造请求体（填入你的完整 Cookie 值，手动处理 URL 编码）
        body: `cookie=${encodeURIComponent("")}&page=1&id=1`
        // 注：用 encodeURIComponent 自动处理 Cookie 中的特殊字符（空格、/、+ 等）
    };

    // 3. 使用 Loon 内置 $httpClient.post 发送 POST 请求
    $httpClient.post(requestParams, function(error, response, data) {
        if (error) {
            // 4. 处理请求错误
            console.error("Fetch error:", error);
            $notification.post("请求失败", "错误信息", error.message); // 可选：发送通知提醒
        } else {
            // 5. 处理请求成功（打印响应并可选发送通知）
            console.log("Response status:", response.statusCode); // 打印状态码
            console.log("Response text:", data); // 打印响应内容（data 即响应文本）
            
            // 可选：用通知展示响应结果（便于快速查看）
            $notification.post("请求成功", `状态码: ${response.statusCode}`, `响应内容: ${data.slice(0, 100)}...`);
        }
        $done(); // Loon 脚本必须调用 $done() 结束任务
    });
}

// 执行脚本入口函数
main();