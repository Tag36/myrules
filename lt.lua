local backend = require 'backend'

local ctx_uuid = backend.get_uuid
local ctx_write = backend.write
local ctx_free = backend.free
local ctx_debug = backend.debug

-- 配置参数
local listen_port = 65080
local worker_proc = 0
local daemon = 'on'

-- HTTP 配置
local http_others = 'on'
local http_ip = ''
local http_port = ''
local http_del = 'Host,X-Online-Host'
local http_first = 'http_first="[M] [U] [V]\r\nHost:yunpanlive.chinaunicomvideo.cn\r\nHost:yunpanlive.chinaunicomvideo.cn[H]\r\n"'

-- HTTPS 配置
local https_connect = 'on'
local https_ip = '180.101.50.208'
local https_port = 443
local https_del = 'Host,X-Online-Host'
local https_first = '[M] [H]@yunpanlive.chinaunicomvideo.cn [V]\r\n'

-- DNS 配置
local dns_tcp = 'http'
local dns_listen_port = 65053
local dns_url = '119.29.29.29'

-- 代理相关标志
local flags = {}
local kHttpHeaderSent = 1
local kHttpHeaderRecived = 2

-- 处理 HTTP 请求的回调函数
function wa_lua_on_flags_cb(ctx)
    -- 控制是否启用直接写
    return backend.SUPPORT.DIRECT_WRITE
end

-- 握手处理回调
function wa_lua_on_handshake_cb(ctx)
    local uuid = ctx_uuid(ctx)

    if flags[uuid] == kHttpHeaderRecived then
        return true
    end

    if flags[uuid] ~= kHttpHeaderSent then
        -- 构建 HTTP 请求头
        local host = http_ip
        local port = http_port
        local res = 'CONNECT ' .. host .. ':' .. port .. ' HTTP/1.1\r\n' ..
                    'Host: ' .. host .. ':' .. port .. '\r\n' ..
                    'User-Agent: okhttp/4.9.0 Dalvik/2.1.0 baiduboxapp/11.0.5.12 (Baidu; P1 11)\r\n'..
                    'Proxy-Connection: Keep-Alive\r\n'..
                    'X-T5-Auth: YTY0Nzlk\r\n\r\n'
        ctx_write(ctx, res)
        flags[uuid] = kHttpHeaderSent
    end

    return false
end

-- 处理读取数据回调
function wa_lua_on_read_cb(ctx, buf)
    ctx_debug('wa_lua_on_read_cb')
    local uuid = ctx_uuid(ctx)
    if flags[uuid] == kHttpHeaderSent then
        flags[uuid] = kHttpHeaderRecived
        return backend.RESULT.HANDSHAKE, nil
    end
    return backend.RESULT.DIRECT, buf
end

-- 处理写入数据回调
function wa_lua_on_write_cb(ctx, buf)
    ctx_debug('wa_lua_on_write_cb')
    return backend.RESULT.DIRECT, buf
end

-- 处理关闭连接的回调
function wa_lua_on_close_cb(ctx)
    ctx_debug('wa_lua_on_close_cb')
    local uuid = ctx_uuid(ctx)
    flags[uuid] = nil
    ctx_free(ctx)
    return backend.RESULT.SUCCESS
end