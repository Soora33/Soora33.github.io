---
title: 基于docker的ELK的部署安装
cover: >-
  https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/0401/wallhaven-7p9vq3_3440x1440.png
top_img: >-
  https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/0401/wallhaven-7p9vq3_3440x1440.png
tags:
  - Elasticsearch
  - Kibana
  - Logstash
  - ELK
categories:
  - 教程
abbrlink: e3acfe82
date: 2023-04-01 17:39:11
---

## 前言

我们在项目中排查错误第一时间会去查看日志，日志可以说在开发中起到了很重要的作用。目前很多项目使用的日志收集系统也主要以ELK和EFK这两种为主（EFK中F为Filebeat，和Logstash相比占用资源更少，并且侵入性低，下次有机会也写一篇。~~又给自己挖了一个坑~~）。这次还是以ELK为主，来教大家从0来搭一套ELK的日志收集系统。同样，本次我们也使用Docker来完成

## ELK是什么?

ELK是由三个开源的中间件组成。是一套分布式日志收集解决方案。其中E指的是Elasticsearch，一个NoSQL数据库，也是我们常用的搜索引擎，主要负责存储日志，L指的是Logstash，主要职责是收集日志，过滤日志，结构格式化，然后将处理好的日志发送到es。 K则是kibana，主要提供一个可视化界面，然后操作es，来帮助我们完成查询操作。

## 构建网络

首先我们需要创建一个网络，来使这三个容器之间可以互相访问，完成通信。

我们在docker中使用下面这个命令来完成网络的创建

```shell
#  创建一个名为mynetwork的网络，指定ip地址为172.19.x.x
docker network create --subnet=172.19.0.0/16 mynetwork
# 查看docker现有网络
docker network ls
```

## Elasticsearch

首先我们创建es的工作目录，这里我放在用户目录下。es目录中有三个文件夹，data（保存es的数据）、plugins（存放插件）、config（es的配置文件）

进入config目录，编辑es的配置文件elasticsearch.yml，其中，host是允许连接的ip，设置为0.0.0.0表示任何人都可以连接，cors是跨域，我们这里放行所有域名

```shell
http.host: 0.0.0.0
http.cors.enabled: true
http.cors.allow-origin: "*"
```

继续完成es的安装脚本，这里可能有的同学会有疑问，为什么要放行2个端口号。因为9200是http协议，用于外部通讯。而9300是tcp协议，一般用来完成集群内节点通信，用于内部通信。

> -e 设置es使用单机模式，同时设定jvm大小，不然es占用内存太大
>
> --network 指定网络 --ip 分配给一个固定ip，不然以后重启ip都会变
>
> -v 挂载文件，将我们刚刚配置的文件和data目录以及插件目录都挂载到容器内

```shell
docker run --name elasticsearch \
 --restart=always \
 -p 9200:9200  -p 9300:9300 \
 -e "discovery.type=single-node" \
 --network sora33network --ip 172.19.0.4 \
 -e ES_JAVA_OPTS="-Xms84m -Xmx256m" \
 -v /Users/sora33/docker/elasticsearch/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml \
 -v /Users/sora33/docker/elasticsearch/data:/usr/share/elasticsearch/data \
 -v /Users/sora33/docker/elasticsearch/plugins:/usr/share/elasticsearch/plugins \
 -d elasticsearch:7.17.0
```

之后给我们的脚本复制可执行权限并执行。可以使用docker ps来查看正在运行的容器。这里我安装了docker的桌面版可以直接查看

![image-20230401184614556](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304011846062.png)

网页上访问ip:9200查看es，可以看到es的各种信息，到此es安装完成

![image-20230401184754498](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304011847587.png)

## Logstash

同样创建Logstash的工作目录，也是config，data，logs。data中的文件不用管，因为我这个是运行过的，所以把容器内的文件就挂载出来了。

![image-20230401200657745](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304012006858.png)

logstash.conf内容如下

>input模块是设置logstash的端口以及数据格式，这里我们设置为json
>
>filter是过滤器，我们在这里把时间格式改了一下，因为默认是格林尼治时间，我们需要加上8小时
>
>output则是输出的地方，我们在这里设置es对应的地址以及索引名格式

```shell
input {
    tcp {
      port => 5043
      codec => json_lines
    }
}
filter {
   ruby {
      code => "event.set('timestamp', event.get('@timestamp').time.localtime+8*60*60)"
    }
   ruby {
      code => "event.set('@timestamp',event.get('timestamp'))"
    }
   mutate {
      remove_field => ["timestamp"]
    }
}
output {
    elasticsearch {
      hosts => ["172.19.0.4:9200"]
      index => "logstash-%{[server_name]}-%{+YYYY.MM.dd}"
    }
    stdout {
  	   codec => rubydebug
    }
}
```

然后是安装脚本，这里也和es一样，挂载目录，给一个固定的ip，之后给权限执行就可以

```shell
docker run -d \
 --network sora33network \
 --privileged=true \
 --ip=172.19.0.6 \
 -p 5043:5043 \
 -v /Users/sora33/docker/logstash/config/logstash.conf:/usr/share/logstash/pipeline/logstash.conf \
 -v /Users/sora33/docker/logstash/data:/usr/share/logstash/data \
 -v /Users/sora33/docker/logstash/logs:/usr/share/logstash/logs \
 --restart=always \
 --name logstash \
logstash:7.17.9
```



## Kibana

最后到可视化工具，创建Kibana的目录如下，同样创建config和data两个文件夹，data数据依旧是容器内部的，直接忽略掉

![image-20230401201327432](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304012013513.png)

kibana的配置文件如下，这里我们需要关心的配置的有

>server.host：主机地址，这里我已经改好了，开放所有连接
>
>server.port：kibana的端口号，默认5601
>
>server.name：kibana服务名
>
>elasticsearch.hosts：这里必须得改成你自己的es地址

```shell
# 主机地址，可以是ip,主机名
server.host: 0.0.0.0
# 提供服务的端口，监听端口
server.port: 5601
# 该 kibana 服务的名称，默认 your-hostname
server.name: "Sora33-kibana"
server.shutdownTimeout: "5s"

#####----------elasticsearch相关----------#####
# kibana访问es服务器的URL,就可以有多个，以逗号","隔开
elasticsearch.hosts: [ "http://172.19.0.4:9200" ]
monitoring.ui.container.elasticsearch.enabled: true

####----------日志相关----------#####

# kibana日志文件存储路径，默认stdout
logging.dest: stdout

# 此值为true时，禁止所有日志记录输出
# 默认false
logging.silent: false

# 此值为true时，禁止除错误消息之外的所有日志记录输出
# 默认false
logging.quiet: false

# 此值为true时，记录所有事件，包括系统使用信息和所有请求
# 默认false
logging.verbose: false

#####----------其他----------#####

# 系统和进程取样间隔，单位ms，最小值100ms
# 默认5000ms
ops.interval: 5000
# kibana web语言
# 默认en
i18n.locale: "zh-CN"
```

安装脚本，执行安装

```shell
docker run -d \
--name kibana \
--network sora33network --ip 172.19.0.5 \
--restart=always \
-p 5601:5601 \
-e TZ="Asia/Shanghai" \
-v /Users/sora33/docker/kibana/config/kibana.yml:/usr/share/kibana/config/kibana.yml \
-v /Users/sora33/docker/kibana/data:/usr/share/kibana/data \
kibana:7.17.0
```

在浏览器地址输入 ip:5601进去kibana主页

![image-20230401201749059](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304012017107.png)

## 项目引入ELK

现在我们已经凑齐了三大组建，开始引入到项目中。创建一个SpringBoot的项目，引入依赖

```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.3</version>
</dependency>
```

在项目resources中创建文件，文件名必须为`logback-spring.xml`，可以参考我设置的格式。主要看logstash的部分，`destination`标签改成ip:端口。customFields这里我们把值改成我们的服务名，这里和我们logstash配置文件中的server_name对应。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- 控制台输出 -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder charset="UTF-8">
            <!-- 输出日志记录格式 -->
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} %highlight(%5p) %magenta(${PID}) [%16.16t] %cyan(%-40.40logger{39}): %msg%n"</pattern>
        </encoder>
    </appender>

    <!--配置logstash配置-->
   <appender name="logstash" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
       <!--指定地址-->
       <destination>127.0.0.1:5043</destination>
       <encoder class="net.logstash.logback.encoder.LogstashEncoder">
           <!--是否打印行号、方法名-->
           <inculdeCallerData>false</inculdeCallerData>
           <!--设置时区-->
           <timeZone>UTC</timeZone>
           <!--设置服务名-->
           <customFields>{"server_name":"testName"}</customFields>
           <!--时间格式化-->
						<!--timestampPattern>yyyy-MM-dd HH:mm:ss</timestampPattern>-->
       </encoder>
   </appender>

    <root level="INFO">
        <appender-ref ref="logstash"/>
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```

启动项目，然后去kibana的堆栈监测中查看logstash的状态，第一次进去的话需要安装

![image-20230401202423516](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304012024565.png)

可以看到logstash的状态已经启动了，并且收集了近200条日志

![image-20230401202657261](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304012026328.png)

在开发工具中可以使用命令查看详情

![image-20230401202824145](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304012028196.png)

那么到这里，我们的ELK就正式搭建完成了
