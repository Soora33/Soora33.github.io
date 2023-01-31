---
title: prometheus+grafana实现项目监控
tags:
  - linux
  - 运维
  - prometheus
categories:
  - 教程
abbrlink: 5020f3ea
date: 2023-01-27 13:18:48
---

## 介绍

prometheus，也叫普罗米修斯。是目前很流行的开源项目监控框架，在项目中引入即可收集项目的信息，然后通过服务器来完成上传。

grafana则是一个可视化工具。拥有比普罗米修斯更为丰富的功能和直观的页面。还可以做到邮箱报警，异常数据跟踪。

## 项目引入

### prometheus

1. 我们加入2个依赖

```xml
 <!--普罗米修斯-->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
    <version>1.9.0</version>
</dependency>
        
<!--将项目内部信息暴露出来-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
    <version>2.6.8</version>
</dependency>
```

2. 在想要监控的服务配置文件中加入以下配置

```yml
# 暴露监控端点
management:
  endpoints:
    web:
      exposure:
        include: '*'
# 激活普罗米修斯
  endpoint:
    prometheus:
      enabled: true
    health:
      show-details: always
# 允许指标导出
  metrics:
    export:
      prometheus:
        enabled: true
```

3. 在服务器上部署prometheus，这里我们使用docker镜像

```shell
docker pull bitnami/prometheus:latest
```

4. 编写普罗米修斯的安装脚本。prometheus.yml文件我放在"/usr/local/docker/prometheus/config"里，这里可以根据自己的需求来改位置

```shell
cat << EOF >> startPrometheus.sh
docker run -d --name=prometheus \
 --ip=47.101.207.184 \ -- 服务器IP地址
 -v /usr/local/docker/prometheus/config/prometheus.yml:/etc/prometheus/prometheus.yml \ -- 文件映射
 -p 9090:9090 \ -- 宿主机端口:容器内部端口
bitnami/prometheus:latest
EOF
```

5. prometheus.yml的内容如下，是普罗米修斯的一些基本配置

```yml
# my global config
global:
  scrape_interval: 15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
# scrape_timeout is set to the global default (10s).
#
# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
      - targets:
        # - alertmanager:9093

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:
# - "first_rules.yml"
# - "second_rules.yml"
# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
# The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: "prometheus"
# metrics_path defaults to '/metrics'
# scheme defaults to 'http'.
    static_configs:
    - targets: ["localhost:9090"]
####
  - job_name: 'spring_auth'
  #  scrape_interval: 15s
    metrics_path: '/actuator/prometheus'
    static_configs:
    - targets: ['项目地址(例如47.101.212.184:80)']
```

6. 配置文件保存完成后我们给刚刚写的安装脚本复制可执行权限

```shell
# 复制权限
chmod -R 700 startPrometheus.sh
# 执行脚本
 ./startPrometheus.sh
```

7. 输入普罗米修斯的地址进入首页查看状态

![image-20230127154744701](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202301271547827.png)

### grafana

接下来我们安装grafana 这里的ip是我们服务器的ip

```shell
docker run -d --name=grafana -p 3000:3000 --ip=47.101.207.184 grafana/grafana
```

1. 命令执行完成后直接访问3000端口号进入grafana主页面，默认用户名密码都是admin

2. 点击左侧DataSource

<img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208081729707.png" alt="image-20220808172942654" style="zoom:67%;" />

3. 设置好该数据源名称 配置好对应的普罗米修斯地址 http://IP:9090

<img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208081730611.png" alt="image-20220808173014548" style="zoom:67%;" />

4. 然后直接点击最底下save&test保存

5. 点击左边的import引入仪表盘，输入4701引入JVM

   <img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202301271418667.png" alt="image-20230127141825584" style="zoom:50%;" />

6. 回到主界面 查看我们的JVM控制中心。至此，普罗米修斯就全部配置完成
