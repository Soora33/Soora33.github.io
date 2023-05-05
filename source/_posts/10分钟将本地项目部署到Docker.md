---
title: 10分钟将本地项目部署到Docker
tags:
  - Docker
  - 运维
categories: 教程
abbrlink: 78034db1
date: 2023-05-02 11:59:43
---

## 前言

很多公司目前发布上线的时候还是手动将jar包打好，然后用Java命令行去启动，~~包括我现在所在的公司~~。这样做无疑是加大了人工成本，这次我打算利用Idea中的官方Docker插件，快速将本地项目发布到服务器的Docker并部署，同时集成后续持续更新的操作

## 安装Docker插件

首先我们得确保Idea中具有Docker插件，在插件列表中搜索`Docker`，如果有下方这个插件我们则继续

![image-20230502120319396](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021203485.png)

## DockerFile

DockerFile是Docker中构建镜像的脚本文件，包含一系列的指令和配置，用来描述如何构建和配置Docker容器，我先简单介绍一下DockerFile中的常用命令，以`命令（示例）：详情`的格式进行介绍

> FROM（FROM java:7）：基础镜像，构建的起点
>
> COPY（COPY file /usr/local）：将本地文件复制到镜像中的指定位置
>
> ADD（ADD pom.xml /usr/local）：将本地文件添加到Docker镜像中，这里要注意和COPY的区别，如果ADD移动的是压缩文件则会自动解压缩，COPY则不会
>
> WORKDIR（WORKDIR /usr/local）：指定工作目录，指定目录之后后续的所有命令都会在该目录下执行
>
> RUN（RUN apt-get update）：一般RUN命令是在镜像构建期间在容器内执行的，例如安装软件包，下载文件，每执行一次RUN命令都会在镜像中创建一个新的中间层，RUN命令可以被多次使用。所以我们尽量避免多个RUN命令。可以使用&& \ 来连接多个命令减少镜像层的创建
>
> ```shell
> RUN apt-get update && \
>     apt-get install -y curl
> ```
>
> CMD（CMD ["RUN","-jar","application.jar"]）：CMD一般是容器启动的执行命令，不会改变Docker镜像的内容，DockerFile中最多只能有一个CMD指令，如果有多个，则只有最后一个生效

## 完成DockerFile的指令

首先我们需要在项目跟目录创建一个文件，名字必须为DockerFile

![image-20230502142414405](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021424457.png)

在DockerFile中完成容器构建，因为我这里使用的是java17所以引入了17，如果是8则可以使用`FROM java:8`完成引入，接着我指定工作目录为/usr/local，表示之后的命令都在该目录下完成，使用ADD命令，将我们本地的jar包指定到工作目录 '. 表示工作目录' 最后用CMD命令启动jar包，同时因为我的项目端口号是1234，使用EXPOSE告诉Docker容器监听这个端口。

```dockerfile
FROM openjdk:17-oracle
WORKDIR /usr/local
ADD ./target/ShardingJDBC.jar .
CMD ["java","-jar","ShardingJDBC.jar"]
EXPOSE 1234
```

> PS：关于jar包的名字可以在pom.xml中指定，使用finalName指定jar包名字

![image-20230502142919341](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021429390.png)

## Idea连接Docker

这里我的Idea版本23.1版本的新UI。连接Docker的位置是在服务选项卡中，有个+号，我们需要新建一个Docker连接

![image-20230502143631045](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021436094.png)

共有三种方式连接到Docker，第一个是连接到我们本地的Docker，第二个是TCP连接，第三个则是SSH。大家根据需求选择对应的连接方式。

![image-20230502143728502](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021437545.png)

这里我连接了一个本地的一个服务器上的，连接完成我们就可以准备创建容器了

![image-20230502144356770](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021443842.png)

## 使用Docker插件创建容器

右键DockerFile修改运行配置

![image-20230502143112755](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021431807.png)

首先完成镜像标记，一般是`作者/容器名称:版本号`构成，容器名称是自定义的

![image-20230502143153522](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021431560.png)

下面我们开始绑定端口，首先点运行右侧的修改，加入绑定端口，根据自己的项目端口号来映射到我们的宿主机上，例如这里我项目端口是1234，我想把他映射到宿主机的4444端口就可以这样配置，配置完成之后点确定。

![image-20230502143315052](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021433091.png)

下面我们需要添加执行前打包的操作，点击加号，添加maven目标，命令行输入`package`应用即可。

![image-20230502143458445](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021434498.png)

完成后我们直接右键Docker File，运行DockerFile，他会开始编译打包运行，容器启动成功。

![image-20230502144625028](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021446100.png)

这里我使用PostMan测试访问一下Docker上的项目，成功打印日志，到此容器部署到Docker完成

![image-20230502145840129](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021458179.png)

## 项目持续更新部署

如果我们的代码更新了或者修改了一些东西，我们直接修改运行配置，可以更改一下版本后，然后重新run一遍DockerFile就可完成更新发布的操作

![image-20230502145004413](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305021450489.png)

以上就是Idea搭配Docker快速部署项目的教程
