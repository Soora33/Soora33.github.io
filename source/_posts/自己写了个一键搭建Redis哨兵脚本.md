---
title: 自己写了个一键搭建Redis哨兵脚本
tags:
  - Redis
categories:
  - 技术学习
abbrlink: 32ecd695
date: 2022-08-17 15:22:52
top_img: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/redis.png
cover: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/redis.png
---

最近在家中无聊写了一个一键搭建Redis哨兵的脚本,是基于Docker搭建的，使用非常简单。

> 下载地址
>
> https://wwu.lanzout.com/ieaAu09pjrsj

**安装脚本流程**

先开放阿里云ICMP（Ipv4）端口，让服务器之间可以建立通信

![image-20220817181436676](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171814726.png)

> 只需要安装Docker，Docker安装跳转https://soora33.github.io/posts/2733575.html
>
> 不需要搭建主从，更不需要安装redis，脚本都会帮你完成
>
> 复制权限，直接执行，输入三个参数，哨兵搭建完成

## 1.哨兵介绍

大家设想一下，如果我们在生产环境部署一个Redis，宕机了怎么办，一瞬间访问不到缓存的请求全部打在数据库上，数据库表示你行你上啊。很容易数据库就会崩，数据库一崩，用户数据做不了持久化，连锁反应造成了我们的服务崩溃了，所以，Redis官方在2.8版本加入了Sentinel模式，也就是哨兵机制

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171601463.jpeg)

## 2.哨兵机制

下面是Redis官方对哨兵的描述

> 监控（Monitoring）：哨兵会不断地检查主节点和从节点是否运作正常
> 自动故障转移（Automatic failover）：当主节点不能正常工作时，哨兵会开始自动故障转移操作，它会将失效主节点的其中一个从节点升级为新的主节点，并让其他从节点改为复制新的主节点
> 配置提供者（Configuration provider）：客户端在初始化时，通过连接哨兵来获得当前Redis服务的主节点地址
> 通知（Notification）：哨兵可以将故障转移的结果发送给客户端

也就是说哨兵运行的时候，会周期性地心跳检测，如果master宕机了，并且指定数量的哨兵也认为master宕机了，则开始进行故障转移，开始重新选举master。选举会从众多个服务器中选举一个服务器作为新的master。选出新的master后，会进行数据同步。之后如果宕机的master启动后，会以从节点的身份重新加入。完成一次故障转移

## 3.主观下线和客观下线

我们判断master主节点是否宕机是通过哨兵ping命令，如果ping超时或者失败，则说明master宕机。一个哨兵认为master宕机了，叫做"主观下线"。如果这个时候进行故障转移，会带来额外的计算和通信开销，为了避免这种情况。我们要严格注意误判。而在哨兵集群中，判断master是否真的下线，不是由一个哨兵决定的。而是由大多数哨兵决定的。一句话，少数服从多数。这个数量一般设置为(哨兵总数/2)+1，这样可以大大避免误判情况发生。

## 4.哨兵核心

> 哨兵是基于主从的，所以具有主从的所有特性
>
> 哨兵模式不保证数据零丢失，只保证redis集群的高可用
>
> 至少三台实例，保证哨兵的健壮性。

## 5.sentinel常用的配置参数如下 

```
# mymaster是哨兵名字 127.0.0.1是master的IP 6379表示端口 2表示有2个哨兵认为master宕机了就进行故障转移
sentinel monitor mymaster 127.0.0.1 6379 2
# mymaster是哨兵名字 30000表示30s没ping通master 认为master宕机
sentinel down-after-milliseconds mymaster 30000
# master和slaves的密码
sentinel auth-pass mymaster 123456
# 主备切换的时间，若在3分钟内没有切换成功，换另一个从节点切换
sentinel failover-timeout mymaster 18000
# 替换主节点后，剩余从节点重新和新master做同步的并行数量，默认为 1
sentinel parallel-syncs mymaster 1
```

## 6.开始搭建

我们准备了三台服务器，将主节点的脚本上传上去，复制权限执行，会提示输入三个参数

![image-20220817164956672](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171649723.png)

主节点就安装完成了，准备安装2个从节点的哨兵，2个从节点也要输入三个参数，和主节点的一模一样，不需要任何改动。等待安装完成就可以\(￣︶￣*\))
