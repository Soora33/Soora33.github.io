---
title: RabbitMQ消息确认机制和消息重发机制
tags:
  - RabbitMQ
  - 消息队列
categories:
  - 教程
abbrlink: 470cda18
date: 2022-08-09 08:10:12
---

##  一.机制

首先我们要知道一条消息的传递过程。

> 生产者 -> 交换机 -> 队列

我们的生产者生产消息，生产完成的消息发送到交换机，由交换机去把这个消息转发到对应的队列上。这其中我们可能在生产者 -> 交换机丢失消息，也可能在 交换机 -> 队列上丢失消息。因此我们需要引入2个概念。

1: 生产者到交换机的可靠保证 (confirmCallback ) 确认回调机制

2: 交换机到队列的保证 (returnCallback ) 返回回调机制

## **二. 保证生产者到交换机的可靠传递**

因为我们的消息都要经过路由，然后去对应的队列，所以第一条线路至关重要。我们使用confirm机制。这个confirm机制是一个异步的，也就是说我们发送一条消息之后可以继续发送下一条消息。比自带的事务好很多。

使用confirm机制首先需要在配置文件中开启confirm机制

```java
  rabbitmq:
    host: localhost
    port: 5672
    virtual-host: /
    username: admin
    password: password
    # 开启生产者消息确认
    publisher-confirm-type: correlated
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)生产者代码

```java
@GetMapping("/send/{tel}")
    public Result send(@PathVariable("tel") String tel) {
        // 开启生产者回调
        rabbitTemplate.setConfirmCallback(new RabbitTemplate.ConfirmCallback() {
            @Override
            public void confirm(CorrelationData correlationData, boolean b, String s) {
                if (b) {
                    log.info("消息发送到交换机成功");
                } else {
                    log.error("消息发送到交换机失败,失败信息[{}]",s);
                }
            }
        });

        // 发送消息
        rabbitTemplate.convertAndSend(RabbitConstant.DIRECT_EXCHANGE,"sms",tel);

        return null;
    }
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)这样我们的消息如果发送到交换机，就会执行[消息发送到交换机成功](签收成功是后面消费者里的消息签收机制，现在不用在意)

![img](https://img-blog.csdnimg.cn/236ddcb286014b10ba7f1e0ca8cadf6b.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==) 现在我们测试一下，我在交换机名字后面加上一个字符串，现在这个交换机是不存在的。看看会发生什么

```java
rabbitTemplate.convertAndSend(RabbitConstant.DIRECT_EXCHANGE+"sora33","sms",tel);
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)![img](https://img-blog.csdnimg.cn/71b218c13c184864a029ee0bfb43550b.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)发送到交换机失败了，执行了我们失败里的回调。这里我们就可以看出这个confirm机制的作用了。它是用来确保确保我们的消息是否到达了交换机。到达了执行ack，没有到达执行nack。我们可以在发送失败的方法里加入自己的逻辑。比如加入到发送失败的表中，或者尝试重新发送...

消息的发送确认机制讲完之后。接下来我们来看一下交换机到队列要如何保证消息的可靠性。

## 三.保证交换机到队列的可靠传递

使用ReturnCallback机制来保证。假设我现在有一个路由模式的交换机。绑定了一个队列，叫send_sms。对应的路由键是sms。如果我给这个交换机发送一条消息。路由键指定smssss。肯定是找不到对应的队列。那么这个时候就会触发ReturnCallback。

setMandatory是用来设置如果没有找到队列，是丢弃还是执行returnedMessage里的方法。false丢弃。

要使用ReturnCallback，我们同样需要在设置中打开配置，很简单。只需要在yml里的mq下面跟一条配置就行了。打开return回调机制

> ```
> publisher-returns:true
> ```

 加入下面的回调属性设置。可以和消息确认机制一起使用。2者互不影响，直接写上去就行。

```java
 // 队列收到消息确认机制
 rabbitTemplate.setReturnCallback(new RabbitTemplate.ReturnCallback() {
 @Override
 public void returnedMessage(Message message, int i, String context, String exchange, 
 String routeKey) {
    log.error("消息[{}]未到达队列[{}],使用的路由键[{}]",message,exchange,routeKey);
   }
 });
 // true -> 消息未到队列中触发MessageReturn false -> 消息未到队列直接丢弃该消息
 rabbitTemplate.setMandatory(true);
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)现在我给一个不存在的路由key发送。交换机肯定是找不到对应的队列的 我们的交换机目前只绑定了路由为sms的一个队列 

![img](https://img-blog.csdnimg.cn/5928fe860bf6448ca20269f7dcdc70d6.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

```java
rabbitTemplate.convertAndSend(RabbitConstant.DIRECT_EXCHANGE,"smssss",tel);
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==) 可以看到，虽然消息进入了交换机，但是找不到对应的队列，执行ReturnCallback回调函数

![img](https://img-blog.csdnimg.cn/a627f00e7463454ba4303a3e22743c73.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)生产者方面的一些机制讲完之后。接下来我们来看消费者中的消息签收机制以及如何重新发送失败的消息。

因为rabbitMQ默认是签收消息的。我们先把签收模式设置为手动签收 顺便配置一下我们的重发配置

```
# 消费端设置手动签收
    listener:
      direct:
        acknowledge-mode: manual
      simple:
        acknowledge-mode: manual
        retry:
          # 开启消息重发机制
          enabled: true
          # 重试次数3
          max-attempts: 3
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)生产者代码 生产者的逻辑很简单。肯定会抛异常。因为我手动设置了一个被除数异常。进入到catch块中。我做了一个存入redis 的操作，将这个消息的标签值作为键。值设置为1.作为重试次数。存入之后mq会自动进行一个重发。当判断重试次数达到3次。直接拒绝签收。并将该消息存到数据库中的重试表。进行一个人工操作...

```java
    int a = 0;

    @RabbitListener(queues = {RabbitConstant.SEND_SMS})
    public void smsQueue(String tel, Message message, Channel channel) throws IOException {
        try {
            int c = 1/a;
            // 签收
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), true);
            log.info("签收成功[{}]",tel);
        } catch (Exception e) {
            // 获取redis重试次数
            Integer value = (Integer)redisUtil.get(message.getMessageProperties().getDeliveryTag() + "");
            if (value == null) {
                // 存入redis
                redisUtil.set(message.getMessageProperties().getDeliveryTag()+"", 1);
            } else if (value.intValue() == 2) { // 如果第三次还是有异常，那么第三次的次数value值还是2 所以加入重试表
                // logic // 加入重试表
                log.error("消息[{}]消费失败...传递参数[{}]", message, tel);
                log.warn("已加入重试表...");
                // 签收失败并不重试
                channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, false);
                return;
            } else {
                redisUtil.set(message.getMessageProperties().getDeliveryTag() + "", ++value);
            }
            log.info("签收失败[{}]",tel);
            throw new RuntimeException("签收异常");
        }
    }
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)![img](https://img-blog.csdnimg.cn/c433dfaea670400fb61491505029f6c5.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

>  当我们给int c = 1/a 改为 c = 1/a++

这个时候第一次会进入catch块。第二次因为a自增。所以不会抛出异常，签收成功

![img](https://img-blog.csdnimg.cn/b2b4bdf723364dee9a6b57aaa5728179.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

##  四.总结

​    RabbitMQ在我们工作中是常用的一个中间件，必须要对齐了如指。既然是中间件，那么势必会有消息丢失产生，还要保证消息的幂等性。本文章是一个进阶文章。RabbitMQ基础跳转

> https://soora33.github.io/posts/4222e73b.html
>
> https://soora33.github.io/posts/414b6727.html
