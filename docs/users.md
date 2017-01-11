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