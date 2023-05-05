---
title: 在项目中引入ShardingJDBC并整合MybatisPlus
tags:
  - ShardingJDBC
  - 分库分表
categories: 教程
abbrlink: cff84f64
date: 2023-04-22 08:41:55
---

## ShardingJDBC介绍

SharingdJDBC是ShardSphere中的一种实现方式（ShardingSphere-Proxy是代理，相当于一个中间件，把所有的请求统一发到Proxy上，在Proxy上对请求进行处理；最后一个是Sidecar，相当于提供一个大网，将所有的数据库织起来，一般用于微服务中）它一个轻量级的Java框架，集成在程序里，通过jar包的方式提供服务，并且支持很多ORM框架，比如我们经常使用的Mybatis、JPA、Hibernate等等

### ShardingJDBC的一些概念

逻辑表：我们一般把结构和逻辑一致的表称为逻辑表，例如user表我拆分为了user01和user02，除了名字以外，其他都一样，那么user就是一张逻辑表。

真实表：真实表就是真实存在的表，上面的user01和user02就是真实表

广播表：公用的一些表，相当于抽象版的"工具类"

分片键：我们分表是按照哪个字段去分，这个字段就是分片键

分片算法：确定分片键后要如何去计算到具体的表。常用的有`取模运算、`hash算法`以及`范围算法`

分片策略：由`分片键和分片算法`组成。用于确定数据应该存储在哪个分片中的算法或规则。例如行表达式分片策略、标准分片策略、范围分片策略...

分片规则管理器：负责管理分片规则和分片策略，根据分片规则将数据分配到不同的数据库节点中。

数据库路由器：根据SQL语句中的分片键，通过分片规则管理器将数据路由到相应的数据库节点中。

数据库代理：负责将SQL语句发送到相应的数据库节点，并将结果合并后返回给客户端。

## 项目实战

### 引入依赖

我们在项目中引入一个Sharding的依赖，这里我用的是5.2.1版本。本次我也整合了MybatisPlus，所以需要多引入一个MybatisPlus的依赖以及druid连接池

```xml
<!--ShardingJDBC-->
<dependency>
  <groupId>org.apache.shardingsphere</groupId>
  <artifactId>shardingsphere-jdbc-core-spring-boot-starter</artifactId>
  <version>5.2.1</version>
</dependency>

<!--druid-->
<dependency>
  <groupId>com.alibaba</groupId>
  <artifactId>druid</artifactId>
  <version>1.2.16</version>
</dependency>

<!--mybatis-plus-->
<dependency>
  <groupId>com.baomidou</groupId>
  <artifactId>mybatis-plus-boot-starter</artifactId>
  <version>3.5.3.1</version>
</dependency>

```

### 配置文件

ShardingJDBC最核心的就是配置部分，这里我使用单库双表实现水平分表先做个小demo，帮助大家快速了解认识Sharding。

我在数据库中有2张表，分别为sora_user01和sora_user02。打算每次插入数据的时候根据id取模判断应该落到01还是02。然后用户读取的时候从2张表中一起获取数据。

水平分表可以降低单表的数据量。demo后面会用2个数据源和2张表来还原项目的真实情况

![image-20230501123157892](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011231943.png)

```yaml
server:
  port: 1234
spring:
  data:
    redis:
      port: 6379
      password: 1202
      host: 127.0.0.1
      database: 0
  #shardingjdbc主要配置
  shardingsphere:
    datasource:
      # 数据源
      names: ds0
      # 数据源名字
      ds0:
        type: com.alibaba.druid.pool.DruidDataSource
        driverClassName: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://127.0.0.1:3306/sora33?serverTimezone=UTC
        username: root
        password: root
    # 规则配置
    rules:
      sharding:
        # 配置各种表
        tables:
          # 表名，对应Java中实体类的类名
          user:
            # 真实表 {1..2}表示范围1-2 {1,2}表示枚举 1和2
            actualDataNodes: ds0.sora_user0$->{1..2}
            # 分片策略配置
            tableStrategy:
              # 标准分片
              standard:
                # 分片列（数据库中的字段名）
                shardingColumn: id
                # 表的分片算法名称 引入我们刚刚配置的user-inline
                shardingAlgorithmName: user-inline
        # 分片算法的配置
        sharding-algorithms:
          # 分片算法名称
          user-inline:
            # 使用INLINE表达式
            type: INLINE
            props:
              # 分片算法的行表达式
              algorithm-expression: sora_user0$->{id % 2 + 1}
        # 配置主键生成策略 使用雪花算法
        keyGenerators:
          snowflake:
            type: SNOWFLAKE
        props:
          #　是否显示sql
          sql-show: true
mybatis-plus:
  mapper-locations: classpath:mapper/**/*.xml
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
    map-underscore-to-camel-case: true
```

Sharding的配置我把它分为三大类，分别是`逻辑表的配置`分表/分库策略`id生成策略`

这三个都要配置在 rules下的 sharding中

首先来说说分表/分库的策略配置，这部分对应的是配置文件中的sharding-algorithms，我们需要先配置算法名称，这个是自定义的，例如我们给user表配置分片算法，那么就可以叫user-inline。随后在算法中配置2个属性，分别是type类型，我们使用INLINE表达式。然后是props中的algorithm-expression配置分片算法的具体逻辑。我这里按照id%2+1，平摊在01和02两个表中。

再来说逻辑表的配置，对应配置文件中tables，我们首先配置表名，这个是自定义的名字，我习惯跟Java的实体类对应（我也试过使用过数据库的表名字发现有问题）。接着需要配置真实表，也就是actualDataNodes的内容，由数据源+表名组成，配置文件中的注释写的很清楚。下面是分片策略tableStrategy，这个是固定的。我们需要选择一个分片策略。ShardingJDBC一共有4种分片策略。

`standard-适用于单分片键场景` 

`complex-适用于多分片键场景`

 `hint-通过Hint指定分片值进行分片`

 `none-不分片`

我们一般使用单分片键来进行分片，所以选择standard。配置2个属性，分别为分片列，也就是按照哪个字段进行分片。第二个属性为分片算法，我们引入刚刚自定义的user-inline算法就可以。

最后是主键的生成策略，一般分布式项目我们使用雪花id就可以了，固定使用SNOWFLAKE来完成。

如果没有看明白或者想了解更多的可以去看看官网的说明

> https://shardingsphere.apache.org/document/current/cn/user-manual/shardingsphere-jdbc/yaml-config/rules/sharding/

### 后端代码

经典的MybatisPlus，这里就不过多赘述了

新增用户的代码：

```	java
 /**
     * 随机生成一个用户，并插入
     * @return
     */
    @Override
    public Result insertUser() {
        int age = generateRandomNumber(10, 60);
        long snowServiceId = snowService.getId();
        User user = new User("testName", age, "男",snowServiceId);
        userMapper.insert(user);
        return Result.success();
    }
    
    public static int generateRandomNumber(int min, int max) {
        Random random = new Random();
        int randomNumber = random.nextInt((max - min) + 1) + min;
        return randomNumber;
    }
```

查询代码：

```java
/**
     * 根据id查询用户
     * @param id
     * @return
     */
    @Override
    public Result selectUserById(Long id) {
        LambdaQueryWrapper<User> query = Wrappers.lambdaQuery();
        query.eq(User::getId, id);
        return Result.success(userMapper.selectList(query));
    }
```

### 测试结果

以上的工作完成后，就可以试验了，先使用postman添加了11条数据

![image-20230501125633929](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011256975.png)

![image-20230501125644379](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011256410.png)

可以发现id尾数为奇数的在02表中，id为偶数的在01表内。成功按照分片策略添加成功。接着我们试一下查询

![image-20230501125831147](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011258183.png)

发现报错了，说的是和分片算法不匹配。

我们看一下源码，发现id是String类型的，String类型是不可以直接使用%运算的。

![image-20230501130108969](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011301028.png)

看一下controller，将String改为Long即可

![image-20230501130157747](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011301787.png)

再试一次，查询成功

![image-20230501130247683](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011302725.png)

当然排查这个错误，我自己也排查了将近半天，各种论坛和github也提问了，期间也问了很多次ChatGPT也没结果，最后反正就是看到GPT在INLINE表达式中用了Math函数才突然有了灵感🤔

### 双数据源双表实战

我们接下来尝试在2个数据源中分库分表的策略。还是一样我们加一个分库的策略，叫database-inline，然后在tables表中引入database的分片策略。

```yaml
  #shardingjdbc主要配置
  shardingsphere:
    datasource:
      # 数据源
      names: ds0,ds1
      # 数据源名字
      ds0:
        type: com.alibaba.druid.pool.DruidDataSource
        driverClassName: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://127.0.0.1:3306/sora33?serverTimezone=UTC
        username: root
        password: root
      ds1:
        type: com.alibaba.druid.pool.DruidDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://150.158.xx.xx:3306/sora33?serverTimezone=UTC
        username: root
        password: root
    # 规则配置
    rules:
      sharding:
        # 配置各种表
        tables:
          # 表名，对应Java中实体类的类名
          user:
            # 真实表 {1..2}表示范围1-2 {1,2}表示枚举 1和2
            actualDataNodes: ds$->{0..1}.sora_user0$->{1..2}
            # 分片策略配置
            tableStrategy:
              # 标准分片
              standard:
                # 分片列（数据库中的字段名）
                shardingColumn: id
                # 表的分片算法名称 引入我们刚刚配置的user-inline
                shardingAlgorithmName: user-inline
            database-strategy:
              standard:
                sharding-column: id
                shardingAlgorithmName: database-inline
        # 分片算法的配置
        sharding-algorithms:
          # 分片算法名称
          user-inline:
            # 使用INLINE表达式
            type: INLINE
            props:
              # 分片算法的行表达式
              algorithm-expression: sora_user0$->{id % 2 + 1}
          # 分库算法
          database-inline:
            type: INLINE
            props:
              algorithm-expression: ds$->{id % 2}
        # 配置主键生成策略 使用雪花算法
        keyGenerators:
          snowflake:
            type: SNOWFLAKE
        props:
          #　是否显示sql
          sql-show: true
```

根据上面的配置我们可以推断出来。id的尾数只有可能是偶数或奇数，偶数的话，分库算法模出来的就是0也就是ds0数据源，同理，分表算法模出来的是0+1也就是user01表，那么反之，奇数对应的是ds1数据源的user02表。我们还是先插入几条配置。

ds0的user01表的数据：

![image-20230501133144329](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011331368.png)

ds1的user02表的数据：

![image-20230501133227978](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011332011.png)

然后我们分别用01的id和02的id去查询都是可以查出来的，这里我就不放图了

### 实现原理

功能上实现后我们就可以分析一下实现流程了。

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011448457.jpeg)

这里我先把官方的解释放出来

> #### SQL 解析
>
> 分为词法解析和语法解析。 先通过词法解析器将 SQL 拆分为一个个不可再分的单词。再使用语法解析器对 SQL 进行理解，并最终提炼出解析上下文。 解析上下文包括表、选择项、排序项、分组项、聚合函数、分页信息、查询条件以及可能需要修改的占位符的标记。
>
> #### SQL 路由
>
> 根据解析上下文匹配用户配置的分片策略，并生成路由路径。目前支持分片路由和广播路由。
>
> #### SQL 改写
>
> 将 SQL 改写为在真实数据库中可以正确执行的语句。SQL 改写分为正确性改写和优化改写。
>
> #### SQL 执行
>
> 通过多线程执行器异步执行。
>
> #### 结果归并
>
> 将多个执行结果集归并以便于通过统一的 JDBC 接口输出。结果归并包括流式归并、内存归并和使用装饰者模式的追加归并这几种方式。
>
> #### 查询优化
>
> 由 Federation 执行引擎（开发中）提供支持，对关联查询、子查询等复杂查询进行优化，同时支持跨多个数据库实例的分布式查询，内部使用关系代数优化查询计划，通过最优计划查询出结果。

经过我自己的整理我把它分为了4步

1. 客户端发送SQL语句到ShardingJDBC。
2. 数据库路由器解析SQL语句，提取分片键。
3. 数据库路由器通过分片规则管理器获取数据应该存储在哪个数据库节点中。
4. 数据库代理将SQL语句发送到相应的数据库节点，并将结果合并后返回给客户端。
