---
title: docker容器内部设置vim镜像
tags: Docker
categories:
  - 教程
abbrlink: 6ba6364a
date: 2022-07-20 20:02:07
updated: 2022-07-20 20:12:33
---

我们有时候要进入到Docker容器内部修改一些文件，vi用不了，vim更不用说了...这次主要分享下容器内部设置vim镜像，从之前的10分钟缩短到现在的1分钟。

**1.首先备份一下我们之前的镜像**

```shell
cp -a /etc/apt/sources.list /etc/apt/sources.list.bak
```

**2.接下来，换成国内163的镜像**

```shell
sed -i 's#http://deb.debian.org#http://mirrors.163.com#g' /etc/apt/sources.list
```

**3.使用apt-get指令，安装vim**

```shell
apt-get update
apt-get install -y vim
```

安装完成，就可以使用vim了，方便快速的搞定
