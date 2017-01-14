# 页面

### 添加一个新页面  

```
	POST /pages
```

`参数:`  

```
	{
		"page": "http://www.baidu.com", # 页面 url，必传
		"title": "百度", # 标题
		"tags": ["百度"], # 标签，不能超过 5 个。标签内容长度不能超过 20 个字符
		"setting": {
			"size": "1920x780", # 页面大小，默认 1024x768
			"delay": 1 # 抓取页面时延时时间，默认 1 秒
		}
	}
```

`返回值:` 

```
	正确结果：
	
	{
		"id": "585f758acb9c00775aabcef1", # page ID
		"user": "585f758acb9c00775abdb091", # 用户 ID
		"page": "http://www.baidu.com",
		"title": "百度", # 标题
		"tags": ["百度"],
		"setting": {
			"size": "1920x780", # 页面大小，默认 1024x768
			"delay": 1 # 抓取页面时延时时间，默认 1 秒
		},
		"createdTime": 1482650342990
	
	}
	
	错误信息：
	
	{"errcode": 40021, "errmsg": "页面地址不正确，必须是以 http 或 https 开头的页面地址。比如：http://www.baidu.com"}
	{"errcode": 40022, "errmsg": "页面标签数量不能超过 5 个"}
	{"errcode": 40023, "errmsg": "标签内容只能是 String 或者 Number 类型"}
	{"errcode": 40025, "errmsg": "页面配置 size 格式不合法，格式应该为 1920x780 样式"}  
	{"errcode": 40026, "errmsg": "页面抓取延时时间不能超过 10 秒"}  
	{"errcode": 40027, "errmsg": "页面标题不能为空，长度不能大于 50 位"}  
```

### 修改页面标签

```
	PUT /pages/:pid
```  


`参数:`  

```
	{
		"title": "baidu", # 标题
		"tags": ["抓页面", "百度"], # 标签，不能超过 5 个。标签内容长度不能超过 20 个字符
		"setting": {
			"size": "1920x780", # 页面大小，默认 1024x768
			"delay": 1 # 抓取页面时延时时间，默认 1 秒
		}
	}
```

`返回值:` 

```
	正确结果：
	
	{
		"id": "585f758acb9c00775aabcef1", # page ID
		"user": "585f758acb9c00775abdb091", # 用户 ID
		"page": "http://www.baidu.com",
		"title": "baidu", # 标题
		"tags": ["抓页面", "百度"],
		"setting": {
			"size": "1920x780", # 页面大小，默认 1024x768
			"delay": 1 # 抓取页面时延时时间，默认 1 秒
		},		
		"createdTime": 1482650342990
	
	}
	
	错误信息：
		
	{"errcode": 40024, "errmsg": "页面不存在"}
	{"errcode": 40022, "errmsg": "页面标签数量不能超过 5 个"}
	{"errcode": 40023, "errmsg": "标签内容只能是 String 或者 Number 类型"}
	{"errcode": 40025, "errmsg": "页面配置 size 格式不合法，格式应该为 1920x780 样式"}
	{"errcode": 40026, "errmsg": "页面抓取延时时间不能超过 10 秒"} 
	{"errcode": 40027, "errmsg": "页面标题不能为空，长度不能大于 50 位"}  
```

### 列表页面

```
	GET /pages
```

`参数:`  

```
	{
		"page": 1, # 分页参数，第几页
		"count": 20, # 分页参数，每页多少条
		"pid": "585f758acb9c00775aabcef1", # page ID 过滤
		"tags": "抓页面", # 标签过滤，可以是数组
		"keyword": "页面" # 关键字查询。从标签中匹配
	}
```

`返回值:` 

```
	正确结果：
	
	{
		total: 34,
		data: [
			{
				"id": "585f758acb9c00775aabcef1", # page ID
				"user": "585f758acb9c00775abdb091", # 用户 ID
				"page": "http://www.baidu.com",
				"title": "baidu", # 标题
				"tags": ["抓页面", "百度"],
				"setting": {
					"size": "1920x780", # 页面大小，默认 1024x768
					"delay": 1 # 抓取页面时延时时间，默认 1 秒
				},
				"createdTime": 1482650342990
			}
			...
		]
	}
	
```
### 删除页面

```
	DELETE /pages/:pid
```  

`返回值:`  

```
	正确结果：
	
	{
		"result": "success"
	}
	
	错误信息：
	
	{"errcode": 40024, "errmsg": "页面不存在"}
```