---
title: docker下安装并使用Jenkins
date: 2022-10-28 20:19:12
tags:

---

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

chown -R 1000 data

通过jenkins的日志获取到控制台的密码

docker logs jenkins

![image-20221028213202065](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202210282135912.png)

输入密码，进去之后点击推荐的插件，等待一段时间后...

![image-20221028213540205](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202210290809583.png)

接着我们创建好账户

url看自己，我用的是默认的

![image-20221029153242691](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202210291532868.png)
