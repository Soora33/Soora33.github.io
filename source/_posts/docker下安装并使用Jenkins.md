---
title: (自动化部署，CI/CD)docker下安装并使用Jenkins
abbrlink: e7a56fe2
date: 2022-10-28 20:19:12
tags:
---

1

前言

CI/CD是持续化继承和持续化部署的简称。目的是在开发的过程中，尽可能的降低人工成本，来完成部署操作。持续集成指的是我们每次开完完成后都会向远程仓库执行push操作。而我们则可以对每一次的push操作，都可以创建一个脚本来构建

### 拉取镜像

使用docker命令拉取jenkins镜像

```shell
docker pull jenkins/jenkins
```

### 编写安装脚本

-d后台运行

-p 将容器内的8080端口映射到宿主机的8081端口上

-v 挂载目录

```shell
docker run -d \
-p 8081:8080 \
-v /usr/local/docker/jenkins/data:/var/jenkins_home \
-t \
--name jenkins \
jenkins/jenkins
```

提前创建好data文件夹，因为jenkins目录权限问题，我们需要给data特定的权限

```shell
chown -R 1000 data
```

权限设置完成后，我们执行刚才的安装脚本，通过jenkins的日志获取到首次登陆控制台的密码

docker logs jenkins

![image-20221028213202065](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202210282135912.png)

## Jenkins设置

进入jenkins的控制台，ip+端口号

> ```
> http://47.101.xx.xx:8081
> ```

输入刚才的密码，进去之后安装推荐的插件，等待一段时间后...

![image-20221028213540205](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202210290809583.png)

安装完成后需要创建我们的账户，这个账号相当于管理员账户。URL一般不用动。

目前为止，Jenkis初始配置就算完成了

![image-20221029153242691](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202210291532868.png)

待续...
