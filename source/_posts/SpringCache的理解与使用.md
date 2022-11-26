---
layout: pots
title: SpringCache的理解与使用
date: 2022-11-26 10:11:47
tags:
  - Redis
  - Spring
categories:
  - 教程
top_img: 'https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/1126/wallhaven-vqml88_3840x2160.png'
cover: 'https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/1126/wallhaven-vqml88_3840x2160.png'
---

## 前言

缓存相信各位都不陌生，作为开发中非常重要的一个组件。是解决高并发与数据库压力的第一方案，目前使用最多的是redis缓存中间件。但对于一些CRUD的缓存，还是有一些人使用的是redisTemplate。开发中经常重复造车轮，以至于没有太多的时间去理解业务和逻辑。而SpringCache就出现了。只需要一行注解，几个配置，缓存的任务就完成了。我们只需要专心写逻辑就可以。使用也十分简单。本次就SpringCache结合当下最常用的redis来实践理解一下

## SpringCache的注解

首先是三个常用注解

> `@Cacheable：获取缓存，如果获取不到缓存则执行本方法 将方法的返回值缓存到redis`
>
> `@CachePut：更新缓存，无论缓存是否存在，都会执行本方法，并且更新到redis`
>
> `@CacheEvict：删除缓存，缓存存在则删除，不存在自然不会删`

下面来看看Cacheable注解中的值

<img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202211261028249.png" alt="image-20221126102824083" style="zoom:67%;" />

> `cacheNames：可以理解为缓存容器的名字，也就是缓存要放进的地方`
>
> `key：理解为redis的key就可以 表示缓存名字`
>
> `keyGenerator：缓存key的生成策略 后面会详细说明`
>
> `cacheManager：指定缓存容器，要从哪个缓存容器获取缓存`
>
> `cacheResolver：管理keyManager的东西`
>
> `condition：el表达式，写入一个条件，方法执行前判断， 为true则存入缓存 false不会存入 `
>
> `unless：el表达式，写入一个条件 方法执行完成后判断，为true不会写入缓存 false会存入（可用于判断返回值中的内容）`
>
> `sync： 是否开启同步 设置为true可以避免缓存击穿等问题`

以上参数中，key和keyGenerator只选其一，cacheResolver和cacheResolver只选其一(这两个一般也不会去设置)

## 依赖与配置文件

依赖只需要引入redis和springCache的依赖就可以

```java
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-data-redis</artifactId>
	<version>2.7.5</version>
</dependency>

<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-cache</artifactId>
	<version>2.7.5</version>
</dependency>
```

yml这里就更简单，只需要将type设置为redis就可以了

```yaml
server:
  port: 8080
spring:
  cache:
    type: redis  
```

## 代码实践

### @Cacheable的使用

我们需要在启动类上`@EnableCaching`来开启缓存

写一个方法，逻辑为如果查询到了缓存则获取缓存的内容，没有则执行方法 然后存入缓存

```java
/**
	* 根据用户id获取用户
	* @param userId
	* @return
*/
@GetMapping("getUserAble/{id}")
@Cacheable(cacheNames = "user", key = "'-' + #userId", sync = true)
public User getUserByIdAble(@PathVariable("id") Integer userId) {
    System.out.println("进入方法");
    HashMap<Integer, User> map = new HashMap<>();
    map.put(1,new User("张三", 17, "画画"));
    map.put(2,new User("李四", 28, "听音乐"));
    map.put(3,new User("王五", 26, "旅游"));
    map.put(4,new User("赵六", 30, "学习"));
    return map.get(userId);
}
```

确保redis中目前没有缓存，然后我们执行方法，第一次控制台打印[进入方法]表名没有获取到缓存

<img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202211261051853.png" alt="image-20221126105144795" style="zoom: 50%;" />

<img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202211261055676.png" alt="image-20221126105534612" style="zoom:50%;" />

之后我们继续访问，则不会继续打印，表名我们获取到的是缓存里的内容。其中，最外层的user是cacheNames。key则为 cacheNames + "::" + 设置的对应key，也就是图中的user::-1

#### 自定义keyGenerator

我们可以会觉得直接在注解上设置key，会有些死板，这个时候我们可以选择自定义keyGenerator来设置key的生成策略

```java
@Configuration
public class UserKeyGenerator {

    // 设置这个生成器的bean名字
    @Bean("UserKeyGenerator")
    public KeyGenerator createUserKeyGenerator() {
        return new KeyGenerator() {
            @Override
            public Object generate(Object target, Method method, Object... params) {
                System.out.println(target);
                System.out.println(method);
                System.out.println(params);
                Object[] arr = params;
                // 使用方法名+ 第一个参数 为key前缀
                return method.getName() + "-" + arr[0];
            }
        };
    }
}
```

target是我们的类地址，method为方法，params则是参数。这里我使用方法名+第一个参数作为key

![image-20221126105842379](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202211261058448.png)

在方法上设置keyGenerator的值选择我们的key生成策略

```java
/**
	* 根据用户id获取用户 使用自定义key生成器
	* @param userId
	* @return
*/
@GetMapping("getUserKeyGenerator/{id}")
@Cacheable(cacheNames = "user", keyGenerator = "UserKeyGenerator", sync = true)
public User getUserByIdKeyGenerator(@PathVariable("id") Integer userId) {
    System.out.println("进入方法");
    HashMap<Integer, User> map = new HashMap<>();
    map.put(1,new User("张三", 17, "画画"));
    map.put(2,new User("李四", 28, "听音乐"));
    map.put(3,new User("王五", 26, "旅游"));
    map.put(4,new User("赵六", 30, "学习"));
    return map.get(userId);
}
```

和第一个key可以对比以下，key变成了我们刚刚设置的格式

<img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202211261059728.png" alt="image-20221126105948684" style="zoom:50%;" />

### @CachePut

相对于Cacheable，put则要简单得多。不管有没有缓存，都会执行方法，存入redis，每一次执行都会更新缓存内容。

```java
/**
	* 无论是否有缓存 每次都会执行方法内容 写入缓存
	* @param userId
	* @return
*/
@PutMapping("getUserPut/{id}")
@CachePut(cacheNames = "user", keyGenerator = "UserKeyGenerator")
public User getUserByIdPut(@PathVariable("id") Integer userId) {
    System.out.println("进入方法");
    HashMap<Integer, User> map = new HashMap<>();
    map.put(1,new User("张三", 17, "画画"));
    map.put(2,new User("李四", 28, "听音乐"));
    map.put(3,new User("王五", 26, "旅游"));
    map.put(4,new User("赵六", 30, "学习"));
    return map.get(userId);
}
```

可以看到，我们点击几次，就执行方法几次，redis自然也是一直被更新的状态

![image-20221126110301847](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202211261103941.png)

### @CacheEvict

删除缓存，执行该方法会删除对应的缓存。这里就不演示了

```java
/**
	* 删除对应的缓存
	* @param userId
	* @return
*/
@DeleteMapping("getUserEvict/{id}")
@CacheEvict(cacheNames = "user", key = "'-' + #userId")
public User getUserByIdExict(@PathVariable("id") Integer userId) {
    System.out.println("进入方法");
    HashMap<Integer, User> map = new HashMap<>();
    map.put(1,new User("张三", 17, "画画"));
    map.put(2,new User("李四", 28, "听音乐"));
    map.put(3,new User("王五", 26, "旅游"));
    map.put(4,new User("赵六", 30, "学习"));
    return map.get(userId);
}
```

**下面我们来说说unless和condition这两个条件**

### unless

unless是方法执行完成之后，判断条件是否为true 为true不会存入缓存。可以使用result来表示返回值

例如这里设置的是如果查询的用户姓名为王五 则不会存入缓存

```java
/**
	* 进阶 unless 可使用el表达式 当值为true的时候不会缓存该次记录
	* @param userId
	* @return
*/
@PostMapping("getUserUnless/{id}")
@Cacheable(cacheNames = "user", key = "'-' + #userId", unless = "#result.name.equals('王五')")
public User getUserByIdUnless(@PathVariable("id") Integer userId) {
    System.out.println("进入方法");
    HashMap<Integer, User> map = new HashMap<>();
    map.put(1,new User("张三", 17, "画画"));
    map.put(2,new User("李四", 28, "听音乐"));
    map.put(3,new User("王五", 26, "旅游"));
    map.put(4,new User("赵六", 30, "学习"));
    return map.get(userId);
}
```

我们查询王五和赵六，查询完成后只有赵六被存入了redis 条件实现

<img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202211261109184.png" alt="image-20221126110917131" style="zoom:67%;" />

### condition

condition同样也是el表达式，不同的是，condition是在方法执行前判断的。为true会存入缓存

例如这里设置的是查询用户id大于2的才会存入缓存

```java
 /**
 	* 进阶 condition 可使用el表达式 当值为true的时候 会缓存该记录
 	* @param userId
 	* @return
 */
@GetMapping("getUserCondition/{id}")
@Cacheable(cacheNames = "user", key = "'-' + #userId", condition = "#userId > 2", sync = true)
public User getUserByIdCondition(@PathVariable("id") Integer userId) {
    System.out.println("进入方法");
    HashMap<Integer, User> map = new HashMap<>();
    map.put(1,new User("张三", 17, "画画"));
    map.put(2,new User("李四", 28, "听音乐"));
    map.put(3,new User("王五", 26, "旅游"));
    map.put(4,new User("赵六", 30, "学习"));
    return map.get(userId);
}
```

我们查询id为1-4的用户

自然只有3和4被存入了缓存

<img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202211261111178.png" alt="image-20221126111130106" style="zoom:50%;" />

看到这里，SpringCache的基本使用就已经完成了。更高阶的操作例如自定义缓存管理器cacheManager，可以实现存入时间的设置。
