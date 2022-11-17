---
title: linux常用的插件安装
tags:
  - linux
  - 服务器
categories:
  - 教程
cover: false
top_img: false
abbrlink: 414b6727
date: 2021-01-22 08:56:10
---

阿里云买一台服务器，部署自己的项目，让别人访问，多有成就感。但是刚买的服务器，上面什么都没装，很多时候都是软件装完了，这里缺一个php，那里缺一个c环境，想要解压个zip文件，发现没有工具...这些都是我们碰到的。这篇文章就把常用的插件一网打尽，到手执行完指令就可以使用。

1. wget wget不用多说了吧 linux的应用市场
2. net-tools 网络工具包
3. gcc C编译器
4. xinetd 网络守护进程服务
5. unzip 解压缩软件，支持解压缩zip
6. lrzsz 替代xftp的工具 直接使用rz命令上传
7. initscripts 一些启动脚本
8. sudo 让我们获得管理员权限的东东
9. libaio 提供给我们异步非阻塞方式读取文件
10. gcc-c++ C++编译器
11. vim* Vim文编编辑神器
12. lsof 方便我们更好的查看端口
13. epel-release 一个第三方源，帮助我们扩展yum
14. pcre-devel PCRE库，支持正则表达式，用nginx必须得有
15. zlib-devel 一些软件会用到的依赖库

开始安装之前，我们先下载一下wget

```shell
yum -y install wget
```

我们切换成国内镜像，首先备份一下yum源

```shell
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
```

配置国内阿里的镜像()

```shell
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
```

生成缓存

```shell
yum makecache
```

给大家提供了一个脚本，直接复制就可以安装完成

```shell
yum install -y net-tools
yum install -y gcc automake autoconf libtool make
yum install -y xinetd
yum install -y unzip
yum install -y lrzsz
yum install -y initscripts
yum install -y sudo
yum install -y libaio-devel.x86_64
yum -y install gcc
yum -y install gcc-c++
yum install -y centos-release-scl
yum install -y devtoolset-9-gcc devtoolset-9-gcc-c++ devtoolset-9-binutils
scl enable devtoolset-9 bash
echo "source /opt/rh/devtoolset-9/enable" >>/etc/profile
yum install -y vim*

```

这样下来，我们服务器上大部分必备组件就安装完成了✔
