// Loon 不支持 http-version 语法，这里通过修改头部来避免 HTTP/2
let headers = $request.headers || {};
headers["Upgrade"] = "h2c"; // 或者直接移除 ALPN 相关标识，强制降级

$done({ headers });