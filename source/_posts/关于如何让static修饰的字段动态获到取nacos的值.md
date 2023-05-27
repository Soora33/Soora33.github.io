---
title: 关于如何让static修饰的字段动态获到取nacos的值
date: 2023-05-25 20:21:54
tags:
  - Nacos
categories:
  - 踩坑记录
---

## 前言 

在平时的开发中，我们一般使用nacos来作为项目的注册中心和配置中心，其中配置中心的动态化配置又是我们经常要用到的设置。配置一些经常发生变化的值特别好用，不需要重启项目，不需要修改代码，只需要在nacos的配置文件修改完成，保存一下就可以完成动态配置。这次我想专门记录一下对于static修饰的值如何获取到值与动态的刷新该值。

## 正常使用案例

首先我们先看一下最为经典的用法，也就是非static字段的使用，我首先在nacos中了如下这么一段配置。

![image-20230525212738252](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305252127356.png)

在代码中我是通过下面代码获取到nacos配置的值，我个人习惯用@ConfigurationProperties指定前缀并搭配@Configuration来使用，通过set来赋值，同时加一个注解RefreshScope来开启动态刷新。

```java
@Data
@RefreshScope
@Configuration
@ConfigurationProperties(prefix = "sora")
public class NacosVo implements Serializable {

    @Serial
    private static final long serialVersionUID = 8996476309916434072L;

    public String name;
    public String age;
    public String sex;
}
```

 简单写一个方法，打印出来

```java
		@Resource
    private NacosVo sora;

    @GetMapping("value")
    public Result getNacosValue() {
        logger.info("nacos中对象：[{}]", sora);
        return Result.success("成功");
    }
```

通过日志我们可以看到获取成功且没有问题，修改值也可以及时更新，这里就不过多赘述，我们进入static部分

![image-20230525213433195](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305252134241.png)

![image-20230525213606699](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305252136761.png)

## 搭配static使用案例

现在我们把所有的字段变为static，重启代码试一下是否还可以获取到值

```java
@RefreshScope
@Data
@Configuration
@ConfigurationProperties(prefix = "sora")
public class NacosVo implements Serializable {

    @Serial
    private static final long serialVersionUID = 8996476309916434072L;

    public static String name;
    public static String age;
    public static String sex;
}
```

很明显，获取到的对象是空的。可以判断出我们修改成了static，变为静态字段后，初始化是在类加载的时候，早于nacos的创建实例阶段，所以我们的字段跟着类加载的时候已经有了默认值，后面nacos的值自然赋值不上，除非我们显示的修改，那么我们要如何获取到nacos的值呢？

![image-20230525213735228](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305252137284.png)

首先先来看一下实体类，与之前唯一不同的地方就是我们只需要手动去创建字段的get和set方法，注意这里使用idea的快捷生成会在方法顺带加上static关键字，我们需要手动的把get和set方法上的static删掉。

```java
@RefreshScope
@Configuration
@ConfigurationProperties(prefix = "sora")
public class NacosVo implements Serializable {

    @Serial
    private static final long serialVersionUID = 8996476309916434072L;

    public static String name;
    public static String age;
    public static String sex;


    public void setName(String name) {
        NacosVo.name = name;
    }

    public void setAge(String age) {
        NacosVo.age = age;
    }

    public void setSex(String sex) {
        NacosVo.sex = sex;
    }

    public String getName() {
        return name;
    }

    public String getAge() {
        return age;
    }

    public String getSex() {
        return sex;
    }
}
```

同时在我们需要使用这个对象的类里，引入NacosVo这个对象并初始化。

```java
    private static NacosVo nacosVo;

    public AuthController(NacosVo nacosVo) {
        AuthController.nacosVo = nacosVo;
    }
```

启动程序，我们可以看到成功获取到了nacos中的值，我们尝试改变一下数据发现仍然可以获取到最新的记录，将nacos的属性信息赋值给静态字段并实现动态刷新就完成了

![image-20230527215001956](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305272150040.png)

## 原理剖析

我们来看这样一组实例

![image-20230527221748344](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305272217397.png)

在程序刚启动后，我分别通过2种方式获取nacos的配置，打印出的结果是一样的，下面我改变nacos的值并重新获取，可以看到，通过get方法获取的值是最新的，但是类名获取的仍然是第一次nacos的值。

![image-20230527221902926](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305272219993.png)

为什么会发生这种情况呢？首先我们需要知道**@RefreshScope**这个注解的作用，这个注解是标记一个Bean或者类，在配置发生变化的时候，Spring会重新创建该容器。而nacos也有一个监听类，叫做**NacosConfigProperties**，是用来监听nacos配置发生变化的，这两个组件的作用下，该bean会重新创建。所以后续通过get方法获取到的都是从最新的该bean中拿到的数据，而类名获取到的则是我们启动框架的时候，初始化进去的当前nacos值，同时因为是static修饰的，跟着类一起加载，如果后续我们没有进行显示的更改，那么是不会发生变化的。

最后总结一下，`NacosConfigProperties` 是负责监听 Nacos 配置变化的组件，而 `RefreshScope` 是负责动态刷新 Bean 的组件。它们一起工作，使得应用程序能够在配置发生变化时自动更新，并实现动态刷新 Bean 的属性值。
