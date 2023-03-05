---
title: (自动化部署，CI/CD)docker下安装并使用Jenkins
abbrlink: e7a56fe2
date: 2022-10-28 20:19:12
tags:
  - jenkis
  - DevOps
categories:
  - 教程
---

## 前言

CI/CD是持续化继承和持续化部署的简称。目的是在开发的过程中，尽可能的降低人工成本，来完成部署操作。持续集成指的是我们每次开完完成后都会向远程仓库执行push操作。而我们则可以对每一次的push操作，都可以创建一个脚本来构建。

### 拉取镜像

使用docker命令拉取jenkins镜像

```shell
docker pull jenkins/jenkins
```

### 编写安装脚本

-d后台运行

-p 将容器内的8080端口映射到宿主机的8081端口上

-v 挂载jenkis、maven与和jdk的目录

-e是配置腾讯的下载源，提升下载速度

```shell
docker run -d \
-p 8081:8080 \
-v /usr/local/docker/jenkins/data:/var/jenkins_home \
-v /usr/local/docker/maven/apache-maven-3.8.5:/usr/local/maven \
-v /usr/local/java/jdk1.8.0_251:/usr/local/jdk \
-e JENKINS_UC=https://mirrors.cloud.tencent.com/kenkins/ \
-e JENKINS_UC_DOWNLOAD=https://mirrors.cloud.tencent.com/kenkins/ \
--restart=always \
--name jenkins \
jenkins/jenkins:lts
```

提前创建好data文件夹，因为jenkins目录权限问题，我们需要给data特定的权限

```shell
chown -R 777 data
```

权限设置完成后，我们执行刚才的安装脚本，通过jenkins的日志获取到首次登陆控制台的密码

```shell
docker logs jenkins
```

![image-20221028213202065](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202210282135912.png)

## Jenkins设置

进入jenkins的控制台，ip+端口号

> ```
> http://IP:端口号
> ```

输入刚才的密码，进去之后安装推荐的插件，等待一段时间后...

![image-20221028213540205](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202210290809583.png)

安装完成后需要创建我们的账户，这个账号相当于管理员账户。目前为止，Jenkis初始配置就算完成了

## 安装插件

进入到主界面后，进入插件安装页面

![image-20230305203733692](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303052037874.png)

点进"Available plugins"。我们需要安装下面两个插件

- git parameter 构建的时候选择分支的插件
- publish over ssh 将代码推送到服务器上

勾选这两个之后，点击"Download now and install after restart" 重启jenkins完成安装

## 配置jdk和maven

从主界面的全局工具配置中点进去，找到JDK，取消勾选自动安装，别名随便起，JAVA_HOME就是我们**映射到jenkins的目录，是jenkins内部的那个目录！**如果有问题，是会有小黄字提示警告的。maven和jdk一样的配置

![image-20230305205839449](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303052058597.png)

使用待补充...
