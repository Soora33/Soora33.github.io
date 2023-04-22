---
title: RabbitMQ六大模式的理解及应用
tags:
  - RabbitMQ
  - 消息队列
categories:
  - 技术学习
cover: >-
  https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/wallhaven-z82kzy_1920x1080.png
top_img: >-
  https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/wallhaven-z82kzy_1920x1080.png
abbrlink: 4b32ef6f
date: 2022-07-03 21:30:10
---

## **基本介绍**

rabbitmq是一个基于Erlang语言开发且非常好用的一款开源的amqp(高级消息队列)。主要的业务场景有秒杀、消息的订阅分发，抢优惠卷等高并发场景。主要的亮点有三个

## **三大亮点**

- 解耦:一个系统调用多个模块。互相调用的关系很复杂很麻烦。如果没有消息队列，每当一个新业务接入，我们都要在主系统调用新接口。使用消息队列，我们只需要关心是否送达。服务自己订阅想要的信息即可
- 削锋:高峰时期对服务器的压力。比如下单的时候，大量的数据直接访问过来根本没时间处理，不妨先把他们存到消息队列里，让服务器不至于崩溃的同时尽可能的快速执行队列中的任务
- 异步:对于不是特别重要的一些请求。假如说有一个操作，要调用三个服务，a200ms，b300ms，c200ms，如果不使用mq的话，用户至少要等700ms，使用mq的话，直接发送3条消息到mq里，大大减少了耗时时间，同时用户体验也上个档次

说完优点，来说说缺点

## 三大缺点

- 系统可用性降低:mq也会出问题，没使用mq之前，a系统调用b系统，b系统调用c系统。这样虽然耦合高，但是可以正常工作。如果把mq引进来，把数据都发给mq，让mq来调用abc三个系统，万一mq挂掉了。这整个业务都崩了
- 系统复杂度提高:引入mq需要考虑消息是否重复消费，确保消息不丢失，还要确保消息的顺序性
- 数据不一致性:如果一个数据被重复消费，破坏了幂等性，也就发生了数据的不一致性

这次来介绍一下6大模式以及用法。

## **简单模式(点对点)**

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151354249.png)

### 模式特点

- **一个生产者，一个消费者**
- **默认使用direct交换机**

初始化两个队列

```java
@Component
public class RabbitmqSimpleConfig {


    /**
     * 初始化短信队列
     *
     * @return
     */
    @Bean
    public Queue simpleSmsQueueInit() {
        // 第一个参数是队列名 第二个是持久化
        return new Queue("sms_simple_queue", true);
    }

    /**
     * 初始化邮箱队列
     *
     * @return
     */
    @Bean
    public Queue simpleEmailQueueInit() {
        return new Queue("email_simple_queue", true);
    }


}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)声明消费者并监听刚刚创建的2个队列

```java
@Component
@Log4j2
public class ConsumerSimple {

    /**
     * 简单模式
     * @param message
     */
    // 监听'sms_simple_queue'这个队列
    @RabbitListener(queues = {"sms_simple_queue"})
    public void getSmsConsumer(String message) {
        log.info("短信消费者接收到信息:" + message);
    }


    /**
     * 简单模式
     * @param message
     */
    // 监听'email_simple_queue'这个队列
    @RabbitListener(queues = {"email_simple_queue"})
    public void getEmailConsumer(String message) {
        log.info("邮箱消费者接收到信息:" + message);
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

```java
@Component
@Log4j2
public class Producer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    /**
     * 简单模式
     */
    public void simpleTest() {
        // 生成测试字符串
        String code= UUID.randomUUID().toString();
        // 向sms_simple_queue这个队列发送code字符串
        rabbitTemplate.convertAndSend("sms_simple_queue",code);
        rabbitTemplate.convertAndSend("email_simple_queue",code);
        log.info("简单模式默认交换机已发出消息");
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)运行测试类，发送成功

```java
@SpringBootTest
class RabbitmqdemoApplicationTests {

    @Autowired
    private Producer producer;

    @Test
    void contextLoads() {
        producer.simpleTest();
    }

}
```

控制台打印消息

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151354375.png)

成功消费2条信息 

## **工作模式**

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151354291.png)

### 模式特点

- **一个生产者，多个消费者**
- **一条消息只能被一个****消费者获取**
- **默认使用direct交换机**

假如说我们的请求量太大，队列堆积的消息太多，一个消费者忙不过来，我们可以增加一个消费者c2.来帮c1分担一些任务。默认使用轮询策略。简单的说，工作模式就是多个消费者监听一个生产者

我们在刚刚的简单模式基础上我们将消费者里，多加一个监听sms的消费者。使用sms一个队列来测试工作模式

```java
@Component
@Log4j2
public class ConsumerSimple {

    /**
     * 简单模式
     * @param message
     */
    @RabbitListener(queues = {"sms_simple_queue"})
    public void getSmsConsumer(String message) {
        log.info("短信消费者1号接收到信息:" + message);
    }
    
    /**
     * 简单模式
     * @param message
     */
    @RabbitListener(queues = {"sms_simple_queue"})
    public void getSmsConsumer2(String message) {
        log.info("短信消费者2号接收到信息:" + message);
    }


    /**
     * 简单模式
     * @param message
     */
    @RabbitListener(queues = {"email_simple_queue"})
    public void getEmailConsumer(String message) {
        log.info("邮箱消费者接收到信息:" + message);
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==) 生产者中我们发送50条消息。

```java
@Component
@Log4j2
public class Producer {

    @Autowired
    private RabbitTemplate rabbitTemplate;


    /**
     * 简单模式
     */
    public void simpleTest() {
        String code= UUID.randomUUID().toString();
        for (int i = 0; i < 6; i++) {
            rabbitTemplate.convertAndSend("sms_simple_queue",code);
        }
        log.info("简单模式默认交换机已发出消息");
    }

}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)启动测试类进行测试，由于mq处理太快。有2条信息在测试类里打印出来了。不影响我们的结果

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355926.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==) 可以看到6条消息被轮询的分发到了2个消费者当中![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355726.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

## **发布订阅模式**/广播模式(fanout)

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355547.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

### 模式特点

- **一个生产者，多个消费者**
- **核心是fanout交换机**
- **流程为:生产者生产消息->交换机收到消息并转发给对应的绑定队列->队列收到消息**

一个生产者发出的消息会被多个消费者获取，平时使用频率也非常高。后面的2种模式都是在发布订阅模式上扩展的

首先我们创建2个队列，分别是消息的队列和邮箱队列 创建一个fanout交换机，将这两个队列绑定到交换机上

```java
@Component
public class RabbitmqConfig {

    /**
     * 初始化fanout交换机
     * @return
     */
    @Bean
    public FanoutExchange fanoutExchangeInit() {
        return new FanoutExchange("fanout_exchange", true,false);
    }

    /**
     * 初始化短信队列
     * @return
     */
    @Bean
    public Queue smsQueueInit() {
        return new Queue("sms_queue", true);
    }

    /**
     * 初始化邮箱队列
     * @return
     */
    @Bean
    public Queue emailQueueInit() {
        return new Queue("email_queue", true);
    }

    /**
     * 短信队列绑定到交换机
     * @param smsQueueInit
     * @param fanoutExchange
     * @return
     */
    @Bean
    public Binding bindingSmsQueue(Queue smsQueueInit, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(smsQueueInit).to(fanoutExchange);
    }

    /**
     * 邮箱队列绑定到交换机
     * @param emailQueueInit
     * @param fanoutExchange
     * @return
     */
    @Bean
    public Binding bindingEmailQueue(Queue emailQueueInit, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(emailQueueInit).to(fanoutExchange);
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

 通过控制台可以看到交换机绑定了2个队列

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355092.jpeg)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

 生产者创建一个队列并发送一条消息。第一个参数是交换机名称，第二个routingKey设置为""，因为发布订阅不需要指定路由的key。第三个参数为要发送的消息内容

```java
@Component
@Log4j2
public class Producer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    /**
     * 发布订阅模式
     */
    public void fanoutTest() {
        String code= UUID.randomUUID().toString();
        rabbitTemplate.convertAndSend("fanout_exchange","",code);
        log.info("交换机已发出消息");
    }

}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)消费者使用spring提供好的注解分别监听2个队列

```java
@Component
@Log4j2
public class Consumer {


    /**
     * 接收短信消费者
     * @param message
     */
    @RabbitListener(queues = {"sms_queue"})
    public void getSmsConsumer(String message) {
        log.info("短信消费者接收到信息:" + message);
    }


    /**
     * 接收邮箱消费者
     * @param message
     */
    @RabbitListener(queues = {"email_queue"})
    public void getEmailConsumer(String message) {
        log.info("邮箱消费者接收到信息:" + message);
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)最后，使用测试类来调用生产者

```java
@SpringBootTest
class RabbitmqdemoApplicationTests {

    @Autowired
    private Producer producer;

   @Test
    void contextLoads() {
        producer.fanoutTest();
    }

}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355828.jpeg)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355602.jpeg)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)发送成功，并且成功监听到消息

## **路由模式(Direct)**

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355234.jpeg)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

### 模式特点

- **一个生产者，多个消费者**
- **使用direct交换机**
- **队列绑定交换机的时候必须指定RoutingKey**
- **发送消息的时候必须指定RoutingKey**
- **RoutingKey可以重复**

发布订阅模式是将消息转发给所有绑定的队列，而路由则会根据RoutingKey(路由key)来匹配完全一致的BindingKey来完成转发。

这里我花了一幅图来帮助大家理解。我们有ABC三个队列，三个队列的routingKey分别为sms,email,phone。这个时候我们的路由交换机有一条消息，这个消息指定了路由key为phone。那么这条消息只有路由key为phone的队列C会收到。 

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355146.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)代码实现也非常简单。

首先是生产者,初始化一个Direct类型的交换机。创建2个队列并且绑定到交换机上。和发布订阅模式不一样的是多了一个with，用来设置RoutingKey。

```java
@Component
public class RabbitmqDirectConfig {

    /**
     * 初始化direct交换机
     * @return
     */
    @Bean
    public DirectExchange directExchangeInit() {
        return new DirectExchange("direct_exchange", true,false);
    }

    /**
     * 初始化短信队列
     * @return
     */
    @Bean
    public Queue directSmsQueueInit() {
        return new Queue("sms_direct_queue", true);
    }

    /**
     * 初始化邮箱队列
     * @return
     */
    @Bean
    public Queue directEmailQueueInit() {
        return new Queue("email_direct_queue", true);
    }

    /**
     * 短信队列绑定到交换机
     * @param directSmsQueueInit
     * @param directExchange
     * @return
     */
    @Bean
    public Binding directBindingSmsQueue(Queue directSmsQueueInit, DirectExchange directExchange) {
        return BindingBuilder.bind(directSmsQueueInit).to(directExchange).with("sms");
    }

    /**
     * 邮箱队列绑定到交换机
     * @param directEmailQueueInit
     * @param directExchange
     * @return
     */
    @Bean
    public Binding directBindingEmailQueue(Queue directEmailQueueInit, DirectExchange directExchange) {
        return BindingBuilder.bind(directEmailQueueInit).to(directExchange).with("email");
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)消费者 进行监听

```java
@Component
@Log4j2
public class ConsumerDirect {

    /**
     * 路由模式短信消费者
     * @param message
     */
    @RabbitListener(queues = {"sms_direct_queue"})
    public void getSmsConsumer(String message) {
        log.info("路由模式短信消费者接收到信息:" + message);
    }


    /**
     * 路由模式邮箱消费者
     * @param message
     */
    @RabbitListener(queues = {"email_direct_queue"})
    public void getEmailConsumer(String message) {
        log.info("路由模式邮箱消费者接收到信息:" + message);
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)定义测试方法，只对RoutingKey为sms的消息队列进行转发

```java
@Component
@Log4j2
public class Producer {

    @Autowired
    private RabbitTemplate rabbitTemplate;


    /**
     * 路由模式
     */
    public void directTest() {
        String code= UUID.randomUUID().toString();
        rabbitTemplate.convertAndSend("direct_exchange","sms",code);
        log.info("路由交换机已发出消息");
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)启动测试类，可以看到只有sms队列收到了消息。email没有反应，证明我们的路由成功了。

## ![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355257.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

## ![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355300.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

## **主题模式(通配符模式)**

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355649.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

###  模式特点

- **和路由模式基础上增加了 使用通配符来进行RoutingKey匹配**
- **使用topic交换机**
- ***匹配1个词**
- **#匹配0/1/多个词**

主题模式也叫通配符模式。通配符有<#>和<*> #代表0级，1级或多级。*代表1级 设置通配符其实就是设置我们的RoutingKey，使用topic交换机来进行规则匹配。

如下图，我们的规则设置为

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151355939.jpeg)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

email队列匹配*.email.*，那么我们的交换机转发消息时的RoutingKey只能为xxx.email.xxx(xxx可以为任意长度)，必须是有且只能有1级。比如com.email.com，这个规则就可以被正确的转发到email队列中

```java
rabbitTemplate.convertAndSend("topic_exchange","com.email.com",code);
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==) sms队列匹配#.sms.# #号是任意级，可以为0，可以为1，可以为多个。以下6种规则全部可以转发到sms队列中

```java
rabbitTemplate.convertAndSend("topic_exchange","sms",code);
rabbitTemplate.convertAndSend("topic_exchange","com.sms",code);
rabbitTemplate.convertAndSend("topic_exchange","com.sms.com",code);
rabbitTemplate.convertAndSend("topic_exchange","com.com.sms.com",code);
rabbitTemplate.convertAndSend("topic_exchange","com.sms.com.com",code);
rabbitTemplate.convertAndSend("topic_exchange","com.com.com.com.sms.com",code);
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==) 有6条待处理消息

 代码实现也很简单，首先依旧是配置类

```java
@Component
public class RabbitmqTopicConfig {

    /**
     * 初始化topic交换机
     * @return
     */
    @Bean
    public TopicExchange topicExchangeInit() {
        return new TopicExchange("topic_exchange", true,false);
    }

    /**
     * 初始化短信队列
     * @return
     */
    @Bean
    public Queue topicSmsQueueInit() {
        return new Queue("sms_topic_queue", true);
    }

    /**
     * 初始化邮箱队列
     * @return
     */
    @Bean
    public Queue topicEmailQueueInit() {
        return new Queue("email_topic_queue", true);
    }

    /**
     * 短信队列绑定到交换机
     * @param topicSmsQueueInit
     * @param topicExchangeInit
     * @return
     */
    @Bean
    public Binding topicBindingSmsQueue(Queue topicSmsQueueInit, TopicExchange topicExchangeInit) {
        return BindingBuilder.bind(topicSmsQueueInit).to(topicExchangeInit).with("#.sms.#");
    }

    /**
     * 邮箱队列绑定到交换机
     * @param topicEmailQueueInit
     * @param topicExchangeInit
     * @return
     */
    @Bean
    public Binding topicBindingEmailQueue(Queue topicEmailQueueInit, TopicExchange topicExchangeInit) {
        return BindingBuilder.bind(topicEmailQueueInit).to(topicExchangeInit).with("*.email.*");
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)绑定好交换机后记得绑定好路由规则RoutingKey 

消费者监听队列

```java
@Component
@Log4j2
public class ConsumerTopic {


    /**
     * 主题模式短信消费者
     * @param message
     */
    @RabbitListener(queues = {"sms_topic_queue"})
    public void getSmsConsumer(String message) {
        log.info("主题模式短信消费者接收到信息:序号:"+ message);
    }


    /**
     * 主题模式邮箱消费者
     * @param message
     */
    @RabbitListener(queues = {"email_topic_queue"})
    public void getEmailConsumer(String message) {
        log.info("主题模式邮箱消费者接收到信息:" + message);
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==) 生产者输入交换机名，输入RoutingKey发消息到交换机中

```java
@Component
@Log4j2
public class Producer {

    @Autowired
    private RabbitTemplate rabbitTemplate;


    /**
     * 主题模式
     */
    public void topicTest() {
        String code= UUID.randomUUID().toString();
        rabbitTemplate.convertAndSend("topic_exchange","com.comcomcom.sms.sora33.33",code);
        rabbitTemplate.convertAndSend("topic_exchange","com.email.sora33",code);
        log.info("主题交换机已发出消息");
    }
}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)测试类进行测试

```java
@SpringBootTest
class RabbitmqdemoApplicationTests {

    @Autowired
    private Producer producer;

    @Test
    void contextLoads() {
        producer.topicTest();
    }

}
```

![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)因为我们的两个路由RoutingKey都可以匹配到对应的队列，所以成功路由到对应的队列当中进行消费

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202304151356671.png)![点击并拖拽以移动](data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw==)

## **6.PRC模式**

**远程调用，很少使用。后续补充...**
