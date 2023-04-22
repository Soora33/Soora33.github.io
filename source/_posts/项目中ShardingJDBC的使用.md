---
title: (待更新)项目中ShardingJDBC的使用
tags:
  - ShardingJDBC
  - 分库分表
categories: 教程
Hidden: true
abbrlink: cff84f64
date: 2023-04-22 08:41:55
---

## ShardingJDBC介绍

SharingdJDBC是ShardSphere中的一种实现方式（ShardingSphere-Proxy是代理，相当于一个中间件，把所有的请求统一发到Proxy上，在Proxy上对请求进行处理；最后一个是Sidecar，相当于提供一个大网，将所有的数据库织起来，一般用于微服务中）它一个轻量级的Java框架，集成在程序里，通过jar包的方式提供服务，并且支持很多ORM框架，比如我们经常使用的Mybatis、JPA、Hibernate等等

## 项目实战

### 引入依赖

这里我们在项目中只需要引入一个Sharding的依赖就可以完成集成

```xml
<!--ShardingJDBC-->
<dependency>
  <groupId>org.apache.shardingsphere</groupId>
  <artifactId>shardingsphere-jdbc-core-spring-boot-starter</artifactId>
  <version>5.1.0</version>
</dependency>
```

