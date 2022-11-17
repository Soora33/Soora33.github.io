---
title: 超好用的Docker可视化管理工具
tags:
  - portainer
categories:
  - 软件安利
abbrlink: 5e59c1d5
date: 2020-03-22 17:38:38
---

今天给大家介绍一个超好用的一款Docker容器可视化工具。叫Portainer，中文名叫集装箱起重机。听名字就知道是个狠角色。~~把Docker吊起来打~~

首先来看下页面 非常的大气简洁，有一些功能很实用，像什么重启，停止，删除点个按钮就可以实现。

![image-20220817150610464](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171506556.png)

![image-20220817150630076](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171506128.png)

## 1.安装镜像

​	我们先创建portainer的目录，这里我选择/usr/local/docker下 创建portainer文件夹

下载最新版的portainer

```
docker pull portainer/portainer
```

## 2.安装汉化包

因为portainer默认英文，我们需要下载汉化包，进入portainer的目录(这一步很重要,不然汉化包挂载不到容器内部)

```shell
cd portainer
wget https://labx.me/dl/4nat/public.zip --2022-05-01 23:09:00--  https://labx.me/dl/4nat/public.zip
```

解压汉化包(这里如果报错，是因为没有下载unzip解压软件)

```shell
# 解压
unzip public.zip
```

```shell
# 没有下载unzip请执行
yum install -y unzip
```

## 3.启动脚本

编写安装脚本,将容器内部9000端口挂载到宿主机的9000上

```shell
cat << EOF >> startPortainer.sh
docker run -d \
--restart=always \
--name portainer \
-p 9000:9000 \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /usr/local/docker/portainer/data:/data \
-v /usr/local/docker/portainer/public:/public \
portainer/portainer:latest
EOF
```

复制权限执行

```shell
chmod -R 700 startPortainer.sh
```

## 4.访问网站

浏览器访问 IP:9000就可以访问进去，初次选择local模式就行
