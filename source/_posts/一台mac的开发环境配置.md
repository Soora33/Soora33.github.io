---
title: 一台mac的开发环境配置
sticky: 4
tags:
  - Mac
categories:
  - 教程
abbrlink: 48c4f338
date: 2023-03-25 16:55:23
---

最近买了一台M1的mac，心水的mac终于到手了，先折腾一阵子，打算写个笔记记录一下。整体分为踩坑点、注意点、和一些常用的小Tips...本文持续更新！！！

一些小Tips:

> 软件如果打不开，提示xxx已损坏，要移到废纸篓
>
> 终端输入`sudo spctl --master-disable`
>
> 还不行则使用`xattr -cr /Application/程序.app`
>
> 例如qq打不开 `xattr -cr /Application/QQ.app`

> 使用Vim编辑完成保存退出失败，强制保存也失败
>
> 很多命令包括复制权限一样，需要在命令前加上sudo使用管理员权限

>mac安装软件很简单，要么去appstore，要么下载安装包，以dmg为后缀的，直接把程序拖到Application，听到叮的一声就完成了

>自带的vim编辑器太丑了？
>
>进入用户目录 cd ~
>
>创建vim配置文件 sudo vim .vimrc
>
>将下面三行写入文件保存，torte是你想保存的主题
>
>```shell
>set nu 
>colorscheme torte 
>syntax on
>```
>
>主题预览可以去下面这个链接查看
>
>https://blog.csdn.net/yishengzhiai005/article/details/51736559?spm=1001.2101.3001.6650.2&amp;utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7ECTRLIST%7ERate-2-51736559-blog-116399060.235%5Ev27%5Epc_relevant_landingrelevant&amp;depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7ECTRLIST%7ERate-2-51736559-blog-116399060.235%5Ev27%5Epc_relevant_landingrelevant&amp;utm_relevant_index=

>显示隐藏文件
>
>command + shift + .

## Docker

1. 前往Docker官网下载mac的Docker版本

![image-20230323205247833](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303232052328.png)

安装完成后注册个账号并登录，我们先配置下载源 

```shell
"registry-mirrors": [
    "https://xxxxx.mirror.aliyuncs.com",
    "https://hub-mirror.c.163.com",
    "https://docker.mirrors.ustc.edu.cn/"
  ]
```

```shell
# 阿里云的下载源获取地址（每个人都不一样放链接）
https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors
# 科大
https://docker.mirrors.ustc.edu.cn/
# 网易
https://hub-mirror.c.163.com/
```

![image-20230323232925385](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303232329906.png)

之后点击右下角的Apply&restart重启 Docker就算安装完成了

## HomeBrew

HomeBrew相当于我们在cenos上使用的yum，不过mac没有yum，取之而代的是神奇HomeBrew，也可以帮助我们下载各种工具，几乎是程序员必备工具。在后面的一些软件中我也会使用HomeBrew来完成下载

```shell
## 这个是官网的 能用官网尽量用官网 后面出问题又重装了一次，第二次下载的是官网的没有问题
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
## 翻不了墙的就使用国内的中科大源
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
# 卸载homebrew
/bin/bash -c "$(curl -fsSL https://gitee.com/ineo6/homebrew-install/raw/master/uninstall.sh)"
```

这里我使用国内的源安装，稍等片刻安装完成后我们使用`brew -v`来查看是否安装成功

![image-20230323214656695](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303232146289.png)

这里我使用brew -v后会提示我们需要执行2条命令，我们执行一下

```shell
git config --global --add safe.directory /opt/homebrew/Library/Taps/homebrew/homebrew-core

git config --global --add safe.directory /opt/homebrew/Library/Taps/homebrew/homebrew-cask
```

之后继续执行`brew -v`没有问题

## Git

直接使用HomeBrew安装Git，版本出来后则安装成功

```shell
# brew安装git
brew install git
# 检测git的版本
git -v
# 顺便安装一下wget，后面安装oh-my-zsh要用
brew install wget
```

## oh-my-zsh

一个zsh美化工具，可以安装

```shell
# 使用wget安装
sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
```

安装完成后会发现我们的zsh客户端已经改变了，可以选择自己喜欢的主题，这里我用的是`ys`主题，可以去下面官方给的主题预览页面选一个喜欢的

> https://github.com/ohmyzsh/ohmyzsh/wiki/Themes

选好之后

```shell
# 编辑zsh的配置文件
vim ~/.zshrc
```

![image-20230323220432356](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303232204937.png)

改完之后保存，然后使用source命令让更改生效，现在主题就已经改好啦

```shell
# 刷新配置
source ~/.zshrc
```

## PicGo

作为一款常用的图床工具，平时写文档上传图片需要用到

去官网下载新版本的包，我当时最新的是2.3.1

`https://github.com/Molunerfinn/PicGo/tags`

这里注意，M1及以上的mac是arm架构的，不要下载错了

![image-20230324222234949](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303242222987.png)

安装完成后，配置好对应的图床信息，以阿里云为例

![image-20230324222543064](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303242225094.png)

## Navicat Premium

我是在俄罗斯破解网站下载的安装包`https://appstorrent.ru/802-navicat-premium.html`

下载完成后双击那个房子的图标，会在桌面看到Navicat的安装磁盘，拖进去完成安装，接下来进行汉化

![image-20230325094844953](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303250948041.png)

下载汉化包，这个汉化包是我从官网navicat提取出来的，可以放心使用。

>链接: https://pan.baidu.com/s/10tYzG1mRVsFGrV13Ujl3JA?pwd=sora 提取码: sora

进入到Navicat的安装目录 

![image-20230325101239204](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251012240.png)

将解压后的文件放到 Contents->Resources 目录下，之后重启完成汉化

![image-20230325101402381](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251014419.png)

## Java17

我们去Oracle官网下载Java，这里以下载17为例。注意自己的mac架构，M1及以上的选择Arm架构

>https://www.oracle.com/java/technologies/downloads/#jdk17-mac

![image-20230325102344000](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251023038.png)

下载完成直接打开安装，安装完成后输入java -version表示我们安装成功

![image-20230325102536828](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251025875.png)

### Java环境变量

这里如果你用的还是bash，那么就不要继续跟了，去网上看一下bash的配置，这里我以大众化的zsh为例

首先获取到我们java的安装目录，一般都在下面这个目录，除了jdk-17xx这个版本号，进到这个目录后，复制路径

![image-20230325103828013](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251038078.png)

```shell
# 编辑zshrc文件
vim ~/.zshrc
# 加入下面两行(注意自己的版本号，一定要对上)
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
export PATH=$PATH:$JAVA_HOME/bin
# 保存退出 刷新文件
source ~./zshrc
# 验证环境变量
echo $JAVA_HOME
echo $PATH
```

![image-20230325104744202](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251047248.png)

### 同时配置Java8和Java17

我们有时候项目是Java8，那么如何在两个版本之间切换呢，其实很简单，我们一样去官网下载Java8的版本（Java8的下载需要登陆Oracle账号）安装过程就不赘述了，安装完成后我们看之前的安装目录，会发现多了一个jdk8的包

![image-20230325105332493](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251053555.png)

我们只需要在刚才的配置文件中多加入一行Java8的配置路径即可，在切换的时候**注释掉java17的环境变量**的就可以，每次配置完成记得source一下，就可以完成双版本的切换

![image-20230325105537398](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251055447.png)

![image-20230325105808140](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251058185.png)

## Submit

我们直接去官网下载Submit最新版，这里我下载的是Submit4

>https://www.sublimetext.com/download

打开后开始汉化，左上角点开Package Control，依次输入Install package -> ChineseLocalizations 完成汉化

![image-20230325140335838](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251403881.png)

## IDEA

我们去官网下载22.3版本（当时最新的稳定版是22.3，并且配套的破解工具也是该版本，如果想下载其他版本的可以去网上找找其他资料）

>注意下载的时候注意架构版本！影响还是挺大的
>
>https://www.jetbrains.com/zh-cn/idea/download/#section=mac

安装完成记得打开一次，exit退出后下载破解工具

>链接: https://pan.baidu.com/s/1Y4Edix7pz26qJEoYZbJ-DQ?pwd=sora 提取码: sora

解压完成后将文件里的方式3，也就是jetbra这个文件夹找一个地方放着（注意，这个文件涉及到破解的变量，所以找好后就不可以改了，并且路径是全英文而且没有空格！！！）这里因为我的用户名是英文，所以我放在用户目录下的public下面。然后在该地址下打开终端，进入script文件夹下，执行

```shell
sudo bash install.sh
# 如果报sed RE什么的错误就执行下面2条指令,继续执行安装命令，看到done表示成功
export LC_COLLATE='C'
export LC_CTYPE='C'
```

成功之后一定要重启电脑！！！打开之后复制破解码即可！

## Maven

去官网下载最新版

>https://maven.apache.org/download.cgi

![image-20230325151351134](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251513709.png)

将解压后的文件找一个路径放好，准备配置环境变量

```shell
export MAVEN_HOME=maven的所在路径
export PATH=$PATH:$MAVEN_HOME/bin
```

![image-20230325152038417](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251520449.png)

配置好环境变量使用source命令刷新配置文件，使用mvn-v来查看版本，输出如下则成功

![image-20230325152144169](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251521206.png)

配置阿里云镜像

```xml
<mirror>
      <id>alimaven</id>
      <mirrorOf>central</mirrorOf>
      <name>aliyun maven</name>
      <url>http://maven.aliyun.com/nexus/content/repositories/central/</url>
</mirror>
```

![image-20230325152551732](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303251525762.png)
