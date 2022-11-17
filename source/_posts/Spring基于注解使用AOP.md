---
title: Spring基于注解使用AOP
tags:
  - Spring
  - Aop
categories:
  - 技术学习
abbrlink: 9668809f
date: 2021-05-05 23:07:25
---

## **概念**

面向切面编程。将多个对象的公共行为抽取封装成一个可重用的模块。降低了模块之间的耦合度。同时提高了系统的可维护性。一般用于权限认证，日志等。

AOP是基于动态代理实现的。如果要代理的对象实现了某个接口，那么AOP就会使用JDK动态代理创建对象。而没有实现接口的对象，就无法使用JDK动态代理。使用Cglib动态代理生成一个被代理的子类来作为代理。

`Aspect`（切面）： 切点+通知。在什么时候，什么地方，做的什么增强

`Joint point`（连接点）：使用通知的一个时机，一般是方法的调用，或异常被抛出

`Pointcut`（切点）：通过通配、正则表达式等方式，定义了切面发生在哪里

`Advice`（通知）：告诉切面要做什么，什么时候开始，比如Before、After、Around等等

`Target`（目标对象）：被通知的对象

`Weaving`（织入）：把切面应用到目标对象，创建对象的一个过程。可以在编译时或运行时完成织入操作。

## **Spring AOP 和 AspectJ AOP的选择**

Spring AOP属于运行时增强。AspectJ是编译时增强，Eclipse基金会出品。SpringAOP基于代理，而AspectJ是基于字节码操作。因为基于字节码操作，所以性能上，AspectJ比springAOP要好上一点。切面越多效果越明显

## **几种通知**

1. @Before：前置通知
2. @AfterRetunring：后置通知
3. @Around：环绕通知
4. @AfterThrowing：异常通知
5. @After：最终通知

**为什么选择注解的方式开发AOP**

先来看一下不使用注解的方式:

execution(<修饰符模式>?<返回类型模式><方法名模式>(<参数模式>)<异常模式>?)  这是连接点的基本语法

execution(* com.sora33.aop.service.sora33Service.sora33ServiceImpl.*(..)) 这个表示切到sora33ServiceImpl下的所有方法

再来看一下注解的方式:

@Around("@annotation(com.sora33.aop.MethodAspect)") 只需要表明我们注解所在位置。然后就会自动匹配有这个注解的方法

## **实战**

先引入aspectjweaver依赖

```xml
<!--aspect-->
<dependency>
    <groupId>org.aspectj</groupId>
    <artifactId>aspectjweaver</artifactId>
</dependency>
```

声明一个接口

```java
/**
 * @className: MethodAspect
 * @description: AOP接口
 * @date: 2021/05/05
 * @author: Sora33
 */
//　作用域
@Target(ElementType.METHOD)
//　生命周期
@Retention(RetentionPolicy.RUNTIME)
public @interface MethodAspect {

}
```

写一个测试方法，加上我们刚刚声明的注解，表示这个方法需要被切入

```java
@MethodAspect
@GetMapping("/{name}")
public String test(@PathVariable("name") String name) {
    System.out.println("调用成功");
    return null;
}
```

然后写一个Aspect类，定义AOP的业务逻辑

```java
@Component
@Aspect
@Log4j2
public class testAop {
    
    // 环绕通知，切点是MethodAspect注解
    @Around("@annotation(com.sora33.aop.aspect.MethodAspect)")
    public void aa(ProceedingJoinPoint joinPoint) {
        // 获取类名
        String className = joinPoint.getTarget().getClass().getSimpleName();
        log.info("类名{}", className);
        try {
            // 获取返回值
            Object proceed = joinPoint.proceed();
            log.info("返回值:" + proceed);
        } catch (Throwable e) {
            e.printStackTrace();
        }
        // 获取参数
        Object[] args = joinPoint.getArgs();
        // 参数转集合
        List<Object> objectList = Arrays.asList(args);
        // 打印参数
        objectList.forEach(a -> System.out.println(objectList));
    }
    
}
```

执行伪代码如下👇:

```
类名:TestController
调用成功
返回值: null
["user"]
```

