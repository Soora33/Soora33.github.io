---
title: 清理服务器上的Docker日志
tags:
  - Docker
categories:
  - 教程
cover: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/dockerClear.jpg
top_img: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/dockerClear.jpg
abbrlink: 37a34086
date: 2021-11-07 21:07:24
---

平时我们Docker运行产生的一些日志文件，莫名其妙的占满了服务器内存，我的服务器都是3天一清。这次分享下清理Docker日志的脚本。

直接找个地方，创建sh文件，例如 vim cleanDockerlog.sh 复制下面代码

```shell
#!/bin/sh
# vim:sw=4:ts=4:et
set -e

DOCKER_STORAGE_PATH="/var/lib/docker"

echo "INFO:======== start clean docker containers logs ========"

logs_file=$(find ${DOCKER_STORAGE_PATH}/containers/ -name *-json.log)  #容器日志文件

for log_name in ${logs_file}
do
    echo "INFO:clean logs : ${log_name}"
    > ${log_name}
done

echo "INFO:======== end clean docker containers logs ========"
```

复制权限 执行就可以

> chmod -R 700 cleanDockerlog.sh
>
> ./cleanDockerlog.sh

每次清理完都少了近50%，还是可以的
