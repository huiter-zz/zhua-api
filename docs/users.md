# 用户

### 1. 注册 

```
	POST /users/register
```

`参数:`  

```
	{
		"email": "t1@zhua.pm", # 邮件地址
		"password": "123456", # 密码
		"referralsCode": "20161225abcd" # 其他人的邀请码 
	}
```

`返回值:` 

```
	正确结果：
	
	{
		"uid": "585f758acb9c00775abdb091", # 用户 ID
		"email": "t1@zhua.pm", # 邮件地址
		"createTime": 1482650342990, # 注册时间
		"invitationCode": "20161225abce", # 自己的邀请码
		"referrals": { #  若填写了邀请码，则此处是邀请人的信息
			"user": "585f758acb9c00775abdb091", # 邀请人 UID
			"code": "20161225abcd", # 注册时填写的邀请码
			"isPay": false # 是否以给邀请用户赠送重置
		}
	}
	
	错误信息：
	
	{"errcode": 40001, "errmsg": "邮件地址不合法"}
	{"errcode": 40002, "errmsg": "密码不合法，密码长度必须大于 6 位并小于 50 位"}
	{"errcode": 40006, "errmsg": "此邮件地址已存在，您可以直接登录或更换邮件地址"}
```  


### 2. 登录

```
	POST /users/login
```

`参数:`  

```
	{
		"email": "t1@zhua.pm", # 邮件地址
		"password": "123456", # 密码
		"remember": true # 是否保持登录状态(为 false 时 cookie 存储两个小时，为 true 时 cookie 存储 30 天)
	}
```

`返回值:` 

```
	正确结果：
	
	{
		"uid": "585f758acb9c00775abdb091", # 用户 ID
		"email": "t1@zhua.pm", # 邮件地址
		"createTime": 1482650342990, # 注册时间
		"loginTime": 1482650442990, # 本地登录时间
		"lastTime": 1482650422990 # 上次登录时间
	}
	
	错误信息：
	
	{"errcode": 40011, "errmsg": "邮件或密码错误"}
```  


### 3. 修改信息 

```
	PUT /users/me
```

`参数:`  

```
	{
		"name": "张三", # 用户名称
		"phone": 13519821678 # 手机号码
	}
```

`返回值:` 

```
	正确结果：
	
	{
		"uid": "585f758acb9c00775abdb091", # 用户 ID
		"email": "t1@zhua.pm", # 邮件地址
		"createTime": 1482650342990, # 注册时间
		"name": "张三", # 用户名称
		"phone": 13519821678 # 手机号码
	}
	
	错误信息：
	
	{"errcode": 40003, "errmsg": "用户名不合法，用户名长度不能大于 40 位"}
	{"errcode": 40004, "errmsg": "手机号码不合法"}
```  
### 4. 修改密码  

```
	PUT /users/me/password
```

`参数:` 

```
	{
		"oldPassword": "123456", # 原始密码
		"newPassword": "987654" # 新密码
	}
```

`返回值:` 

```
	正确结果：
	
	{"result": "success"}
	
	错误信息：
	
	{"errcode": 40005, "errmsg": "原始密码不合法"}
	{"errcode": 40002, "errmsg": "密码不合法，密码长度必须大于 6 位并小于 50 位"}
``` 
### 5. 登出

```
	DELETE /users/logout
```

`返回值:` 

```
	{"result": "success"}
	
```

### 6. 获取自己的余额  

```
	GET /users/balances
```

`返回值:`
 
```
	{
		"user": "585f758acb9c00775abdb091", # 用户 ID
		"cash": 1000, # 现金充值余额
		"gift": 3000 # 赠送余额
	}
```

### 7. 获取自己已邀请的用户列表  

```
	GET /users/invitations
```
`参数:`  

```
	{
		"page": 1, # 分页参数，第几页
		"count": 20, # 分页参数，每页多少条数据	
	}
```

`返回值:`  

```
	{
		"total": 43,
		"data": [
			{
				"nickname": "李四", # 被邀请用户昵称
				"avatar": "http:zhua.pm/t.png", # 被邀请用户头像
				"referrals": {
					"user": "585f758acb9c00775abdb091", # 自己的用户 ID
					"code": "20161225abcd", # 当时的邀请码
					"isPay": true, # 被邀请用户是否已充值
					"amount": 1000 # 被邀请用户第一次充值金额
				}
			}
			...
		]
	}
```

### 8. 获取自己的操作日志记录  

```
	GET /users/logs
```

`参数:`  

```
	{
		"type": "login", # 日志类型，可以是数组，或者是已 `,` 分隔的字符串。
		"stime": 1482650342990 # 时间过滤，起始时间
		"etime": 1482656541990 # 时间顾虑，结束时间
	}
```

`返回值:`  

```
	{
		"total": 132,
		"data": [
			{
				"user": "585f758acb9c00775abdb091", # 自己的 ID
				"type": "register", # 日志类型
				"ip": "127.0.0.1", # 用户客服端 IP 地址
				"createdTime": 1482650342990 # 发生时间
			},
			{
				"user": "585f758acb9c00775abdb091",
				"type": "gift",
				"ip": "127.0.0.1",
				"data": {
					"by": "register", # 注册赠送
					"amount": 1000 # 10 元
				},
				"createdTime": 1482650612994
			},	
			{
				"user": "585f758acb9c00775abdb091",
				"type": "login",
				"ip": "127.0.0.1",
				"createdTime": 1482650612990
			},
			{
				"user": "585f758acb9c00775abdb091",
				"type": "cash",
				"ip": "127.0.0.1",
				"data": {
					"amount": 1000
				},
				"createdTime": 1482650612990
			},
			{
				"user": "585f758acb9c00775abdb091",
				"type": "updateInfo",
				"ip": "127.0.0.1",
				"data": {
					"name": "张三",
					"phone": 13498762781
				},
				"createdTime": 1482650712990
			},
			{
				"user": "585f758acb9c00775abdb091",
				"type": "updatePass",
				"ip": "127.0.0.1",
				"createdTime": 1482650812990
			},
			{
				"user": "585f758acb9c00775abdb091",
				"type": "addPage",
				"ip": "127.0.0.1",
				"data": {
					"page": "http://www.baidu.com",
					"tags": ["百度"]
				},
				"createdTime": 1482651342990		
			}
			...
		]
	}	
```

* type 可取值  

`register`: 注册  
`login`: 登录  
`updateInfo`: 修改新用户信息  
`updatePass`: 修改密码  
`addPage`: 添加新页面  
`updatePage`: 修改页面信息  
`delPage`: 删除页面  
`uploadFile`: 上传文件  
`cash`: 现金充值  
`gift`: 赠送充值  
