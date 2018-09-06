#!/bin/bash
# 定时清理 snapshot 目录下的文件，避免文件过大

dateArr=()
today=`date +%Y%m%d`

# 判断目录是否存在
if [ -d "snapshot" ]; then
	rm snapshot/* !snapshot/.keep
fi
