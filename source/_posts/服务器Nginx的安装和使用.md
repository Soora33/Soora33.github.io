---
title: 服务器上Nginx的安装和使用
tags:
  - Nginx
  - Linux
  - 负载均衡
categories:
  - 教程
cover: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/0817/wallhaven-y88x6k_1920x1080.png
top_img: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/0817/wallhaven-y88x6k_1920x1080.png
abbrlink: 58b62c51
date: 2021-03-07 20:10:48
---

##  nginx介绍

​    nginx是一款使用C语言编写的高性能的代理服务器。优点是占用内存小，并发能力强。达到了5W。一般用来做负载均衡   

## 1.官网下载nginx压缩包

> 我们先去官网下载一个最新稳定版的nginx
>
> http://nginx.org/en/download.html

 ![img](https://img-blog.csdnimg.cn/32546b5d407e44cd9109c4e60ddb6e35.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

然后使用xftp或者rz上传到我们的服务器

> \# 解压压缩包
>
> tar -zxvf nginx-1.22.0.tar.gz

 然后进入到目录里面，查看是否有可执行权限(是不是绿色的)，没有赋予执行权限

> \# 赋予执行权限
>
> **chmod +x configure**

 ![img](https://img-blog.csdnimg.cn/fabdd13e04474cf9b86dcab5af27d69b.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

## 2.安装nginx所需要的环境

在安装之前先安装nginx所需要的一些环境

```bash
# c编译器
yum -y install gcc gcc-c++ autoconf automake make
# 解析正则的pcre库
yum install -y pcre pcre-devel
# 添加对gzip的支持
yum install -y zlib zlib-devel
# SSL
yum -y install pcre  pcre-devel zlib  zlib-devel openssl openssl-devel
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

## 3.开始安装

准备安装 **这里强烈建议安装stream模块,stream是用来处理tcp转发的。不然后面想用没有会很麻烦!!! 如果真的用不到stream可以不输入--with-stream**

> \# 开始安装
>
> ./configure --with-stream
>
> \# 安装完成之后编译
>
> make
>
> \# 安装编译后的文件
>
> make install
>
> \# 安装nginx源
>  curl -o /etc/yum.repos.d/epel.repo http://mirrors.aliyun.com/repo/epel-7.repo
>
> \# 安装常用软件源
>  yum -y install epel-release
>  \# 安装modules模块
>  yum -y install nginx-all-modules.noarch

默认安装在/usr/local/nginx里。

进入sbin文件夹中 执行./nginx启动nginx。

至此nginx的安装就结束了，浏览器输入IP:端口号查看是否可以进入nginx主界面，进入则成功。

**注意nginx默认端口号是80.需要提前去阿里云安全组中开放端口。同时把本机的防火墙关闭。**

> **# 关闭防火墙**
>
> **systemctl stop firewalld**

**如果想要修改端口号可以去conf下的nginx.conf中修改，修改完成后去sbin文件夹中执行****./nginx -s reload****重启nginx**

![img](https://img-blog.csdnimg.cn/7e897f6f29fe48d782829c0c6ef82607.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

## 4.基础命令

**以下命令必须去sbin下执行**

> \# 查看nginx语法是否正确
>
> ./nginx -t
>
> \# 启动nginx
>
> ./nginx
>
> \# 刷新配置文件
>
> ./nginx -s reload
>
> \# 查看版本 任意地方可执行
>
> nginx -V
>
> \# 正常关闭
>
> ./nginx -s quit
>
> \# 强制关闭
>
> ./nginx -s stop
>
> \# 查看nginx进程
>
> ps aux|grep nginx

## 5.负载均衡

首先说一下什么是负载均衡。负载均衡就是将所有的请求给分发到不同的服务器。可以减少服务器压力。同时隐藏了真实服务器的ip。具体的说就是对外暴露出一个端口。nginx来代理监听这个端口。然后使用负载均衡配置的服务来进行对应的转发操作。下面来看一些简单的例子。

![img](https://img-blog.csdnimg.cn/img_convert/efbefc73731019caf3cbe928c89fd8a6.jpeg)

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

 这是一个最基本的负载均衡配置。test是负载均衡的名字。

负载均衡配置全部写在nginx.conf的http模块中

 ![img](https://img-blog.csdnimg.cn/5087d89370a2486b9c9e5dbba6f57988.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

 上面配置的效果是我们访问7788这个端口号。nginx会将请求按照默认的轮询方式分配到80和9101端口上。进行一个转发跳转。

我们访问7788端口，第一次成功进入nginx的主页面。 

![img](https://img-blog.csdnimg.cn/2ae70b157dbd4cb6aaa4cd037e4562b3.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)第二次访问7788端口，访问到docker可视化页面，端口号为9101，同样成功。

![img](https://img-blog.csdnimg.cn/8e37b960a8154092854f3f593b4dd35a.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)以上就是一个简单的负载均衡的例子。下面来说说负载均衡的模式

## 6.负载均衡三大模式 

### 1.轮询

负载均衡默认使用的就是轮询。将请求按照顺序分配到服务上。

![img](https://img-blog.csdnimg.cn/0f00cf7e669144f6b65eef839138f59b.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

### 2.权重

通过weight指定权重值。比如下图有5个请求进来。有4个会被分配到9101上

![img](https://img-blog.csdnimg.cn/f73da7ac971940a38fa9ef689fa2e1d9.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

### 3.IP散列

通过对访问的IP的hash结果来决定转发到哪个服务上。固定IP会固定被转发到对应的服务上

![img](https://img-blog.csdnimg.cn/285d0a735fa947b2977fc26dcb97cac0.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

##  7.踩坑点

自己一个人摸爬滚打才出来的坑，希望大家可以少踩一点坑

```
1. nginx绝对不可以使用tab当空格使用
2. 在nginx.conf中配置的东西不要和conf.d中重合
3. 有一些编码冲突可以设置文件编码为utf-8 在vim中输入 :set fileencoding=utf-8
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)
