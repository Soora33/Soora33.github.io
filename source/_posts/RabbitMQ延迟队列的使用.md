---
title: RabbitMQ延迟队列的使用
tags:
  - RabbitMQ
  - 消息队列
categories:
  - 教程
cover: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/0817/wallhaven-g7kwk3_1920x1080.png
top_img: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/0817/wallhaven-g7kwk3_1920x1080.png
abbrlink: 4222e73b
date: 2022-07-04 19:03:47
---

这次打算说一下rabbitmq的延迟队列。

延迟队列，名字中有个队列，队列是先进先出的。所以说延迟队列是一个有方向性的。

其次，延迟队列和普通队列最大的区别就是，普通队列里的消息是希望自己早点被取出来消费。而延迟队列中的消息都是由时间来控制的。也就是说，他们进入队列的时候，就已经被安排何时被取出了

rabbitmq实现延迟队列主要有种方式。

第一种是使用普通队列和死信队列来模拟实现延迟的效果。大致上是将消息放入一个没有被监听的队列上，设置TTL(一条消息的最大存活时间)为延迟的时间，时间到了没有被消费，直接成为私信。监听私信队列来进行操作。

第二种是使用rabbitmq官方提供的delayed插件来真正实现延迟队列。本文对第二种进行详解

# 应用场景

- 订单超时支付取消订单
- 用户发起退款卖家3天不处理自动退款
- 预约抢购活动，活动开始前10分钟短信通知用户

# 安装延迟插件

默认交换机是有4种模式的

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011454280.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

 现在我们去安装延迟插件

> https://www.rabbitmq.com/community-plugins.html 

前往官网去下载延迟插件

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011454568.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011454424.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)下载完成之后，上传到我们的服务器。使用下面的命令将插件复制到mq容器的plugins目录下

```shell
docker cp rabbitmq_delayed_message_exchange-3.10.2.ez rabbitmq:/plugins
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011454531.png)

容器日志提示已经启用delayed插件

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011454960.png)

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)交换机新增一个延迟模式

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011454907.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)编辑

# 配置类

直接上代码，首先是我们的配置类。初始化一个队列和一个延迟交换机(这里我交换机模式用的是路由模式)。将队列绑定到交换机上并设置路由Key

```java
@Component
public class RabbitmqDelayedConfig {

    /**
     * 初始化延迟交换机
     * @return
     */
    @Bean
    public CustomExchange delayedExchangeInit() {
        Map<String, Object> args = new HashMap<>();
        // 设置类型，可以为fanout、direct、topic
        args.put("x-delayed-type", "direct");
        // 第一个参数是延迟交换机名字，第二个是交换机类型，第三个设置持久化，第四个设置自动删除，第五个放参数
        return new CustomExchange("delayed_exchange","x-delayed-message", true,false,args);
    }

    /**
     * 初始化短信队列
     * @return
     */
    @Bean
    public Queue delayedSmsQueueInit() {
        return new Queue("sms_delayed_queue", true);
    }


    /**
     * 短信队列绑定到交换机
     * @param delayedSmsQueueInit
     * @param customExchange
     * @return
     */
    @Bean
    public Binding delayedBindingSmsQueue(Queue delayedSmsQueueInit, CustomExchange customExchange) {
        // 延迟队列绑定延迟交换机并设置RoutingKey为sms
        return BindingBuilder.bind(delayedSmsQueueInit).to(customExchange).with("sms").noargs();
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

#  生产者

将消息转发到"delayed_exchange"交换机上路由键为"sms"的队列中

```java
@Component
@Log4j2
public class Producer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    /**
     * 延迟模式
     * @param msg 消息
     * @param time 延迟时间
     */
    public void delayedTest(String msg,Integer time) {
        // 第一个参数是延迟交换机名称，第二个是Routingkey，第三个是消息主题，第四个是X，并设置延迟时间，单位		是毫秒
        rabbitTemplate.convertAndSend("delayed_exchange","sms",msg,a -> {
            a.getMessageProperties().setDelay(time);
            return a;
        });
        log.info("延迟模式默认交换机已发出消息");
    }

}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

# 消费者 

监听指定的队列。一旦队列中有消息则立刻取出进行消费

```java
@Component
@Log4j2
public class ConsumerDelayed {

    /**
     * 延迟模式短信消费者
     * @param message
     */
    @RabbitListener(queues = {"sms_delayed_queue"})
    public void getSmsConsumer(String message) {
        log.info(new Date().toLocaleString() + "延迟模式短信消费者接收到信息:" + message);
    }

}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011454689.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305011454333.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==) 发出消息并且10S后延迟队列对消息进行消费，延迟队列实现成功
