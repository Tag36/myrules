<!DOCTYPE html>
<html>
<body>
  <script>
    // 1. 配置请求参数（与Python代码完全对应）
    const url = "http://123.138.11.116";
    const data = new URLSearchParams({ // 模拟表单格式（application/x-www-form-urlencoded）
      "cookie": ="TOKEN_UID_NAME=GiSUrOdExHiJ3/cc6LJJEFqkbiC1DpjZIaVwynxhDmykxX5xg14RbuR2Z+VFqjY00iYb4kT9KDIi6anu8TT2unrVxw8quugUj9UxETWPnEaiBSvYTjTle/rbBT0m3ve9zS/136I4R9C6TY0IlIR8k3Gn8TzMQF2db4rqIi5E1SffMVhX4k6MuekRVhKMnM0NSidqoh223cRNt7CJJ2rcATiNlBKbPVujp4UhUhVpdrw", // 注意：原Python代码中“cokkie”拼写错误（正确为“cookie”），此处保留原拼写
      "page": 2,
      "id": 1
    });
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded"
    };

    // 2. 发送POST请求（使用async/await简化异步逻辑）
    async function sendPostRequest() {
      try {
        const response = await fetch(url, {
          method: "POST", // 指定请求方法为POST
          headers: headers,
          body: data // 表单格式数据放入body
        });

        // 若状态码不是2xx，主动抛出错误（对应Python的response.raise_for_status()）
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // 读取响应内容（对应Python的response.text）
        const responseText = await response.text();
        console.log("Response text:", responseText);
      } catch (error) {
        // 捕获所有请求异常（网络错误、状态码错误等，对应Python的requests.RequestException）
        console.log("Fetch error:", error.message);
      }
    }

    // 3. 执行请求
    sendPostRequest();
  </script>
</body>
</html>