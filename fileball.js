/***********************************
规则完全免费，仅供学习交流，严禁商业用途

[rewrite_local]
^https?:\/\/api\.revenuecat\.com\/v1\/(receipts|subscribers\/\$RCAnonymousID%3A\w{32})$ url script-response-body https://raw.githubusercontent.com/Tag36/myrules/main/fileball.js
