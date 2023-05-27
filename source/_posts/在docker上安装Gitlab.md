---
title: 在docker上安装Gitlab
tags:
  - GitLab
categories:
  - 教程
abbrlink: 68f592be
date: 2023-03-05 14:11:49
---

## gitlab介绍

gitlab是一款基于git仓库的代码管理工具，可以帮助我们团队进行版本控制和协作开发。gitlab还提供了完整的持续集成/持续交付平台，能够自动化代码构建、测试、发布等过程，并且是一款开源的平台，公司也可以根据需求来进行定制化，满足不同团队，适应不同的需求和流程。

## 下载镜像

```shell
# 下载gitlab镜像
docker pull gitlab/gitlab-ce 
```

##  编写安装脚本

注意我们这里要挂载三个目录，我的目录是在/usr/local/docker/gitlab下面的三个文件夹里面。其中/etc/gitlab为保存gitlab的配置文件，/var/log/gitlab为保存gitlab的日志文件，/var/opt/gitlab为保存gitlab数据文件。这里我用的端口号是9980

```shell
docker run --name gitlab --restart always \
 -p 9980:9980 -p 222:22 \
 -v /usr/local/docker/gitlab/config:/etc/gitlab \
 -v /usr/local/docker/gitlab/logs:/var/log/gitlab \
 -v /usr/local/docker/gitlab/data:/var/opt/gitlab \
 -d gitlab/gitlab-ce
```

进入容器，修改配置，这里的端口号是我们刚刚映射的容器内部端口号9980

```shell
# 进入容器
docker exec -it 容器id /bin/bash
# 编辑文件
vi /etc/gitlab/gitlab.rb

#加入如下
#gitlab访问地址
external_url 'http://IP:port'

#退出容器
exit

# 重启gitlab
docker restart 容器id

```

## 修改默认密码

输入gitlab的访问地址，用户名默认为root，密码则使用下面命令查看

```shell
# 查看gitlab的默认密码
docker exec -it 容器id grep 'Password:' /etc/gitlab/initial_root_password
```

之后进入主界面后点击右上角"Preferences"，然后再点击Password，修改默认密码

![image-20230305195332598](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202303051953837.png)

到这里gitlab的安装就完成了，当然很多人可能会出现504等错误，第一原因是gitlab占用的内存很大，我服务器上就占了3g，并且根据服务器的性能，启动的时间也会有很大出入，如果刷新不出页面或者504错误，可以等待5-10分钟，如果还是不行，多半就是内存爆了，尝试关点程序，或者升级服务器的内存就可以解决
