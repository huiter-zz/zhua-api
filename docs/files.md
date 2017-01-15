# 文件上传  

1. 上传文件  

```
	POST /files/upload
```

`参数:`  

```
	{
		"file": FileStream # 文件数据流
	}
```

`返回值:`  

```
	{url: 'http://zhua.pm/123123123.png'}
```