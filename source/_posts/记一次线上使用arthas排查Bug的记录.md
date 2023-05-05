---
title: 记一次线上使用arthas排查Bug的经验
date: 2023-05-05 21:15:31
tags:
  - arthas
  - JVM
categories: 教程
---

最近几天公司的服务器经常出现接口调用超时的情况，接口的状态一直是pending的状态，起初以为是程序的堆栈空间爆掉了，重启了项目并不好使，发现问题并没有这么简单，好在之前自己用过arthas，想起了这个工具，于是打算重拾arthas完成这次的bug排查。

首先去官网下载了最新的arthas，因为我用的java程序启动的，直接把整个包拖到服务器中，再使用java -jar启动起来就可以。之后会出现一排的java服务，前面会有很多序号，我们选择需要调试的java程序序号就可以进入该程序的内部，准备开始调优。

进入到下面这个页面就表示我们成功使用arthas连接到了java程序内

![image-20230505212436246](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305052124347.png)

> arthas官网命令列表
>
> https://arthas.aliyun.com/doc/commands.html

我先说几个常用的命令

1. dashboard 查看控制台，这个命令可以让我们快速的浏览目前的程序情况，包括线程的状态，新生代老年代以及运行java程序的系统信息等等

   ![image-20230505212919528](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305052129565.png)

2. jvm 查看jvm的信息，这里信息太多只截了部分，例如线程部分从上到下依次是活跃数、守护线程活跃数、曾经的最大活跃数、总启动线程次数、当前死锁数

   ![](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305052132311.png)

3. thread 查看线程信息 使用thread -all查看所有线程信息。

   thread -b查看当前阻塞其他线程的线程，个人认为这个很有用，尤其是发生死锁的时候。thread -n 3 打印出当前最忙的前3个线程。thread '线程ID' 查看该线程信息

   ![image-20230505213755720](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305052137756.png)

4. jad 反编译字节码文件 这个对于当前看不了源码的人还是很友好的，只要知道错误的类路径 使用jad 类路径就可以查看类的源码

   ![image-20230505214102760](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202305052141819.png)

5. heapdump 生成hprof文件 这个就不多解释了 内存溢出或泄漏肯定要看的文件

目前就是这几个命令，之后可能会继续补几个..

继续说回线上排查bug的问题，因为公司是内网开发，只能文字描述😶。首先是用了dashboard命令，大致看了一下目前的堆栈情况，以及gc次数。发现没有异常。继续使用thread -all查看所有线程，果不其然，发现有好几个线程是阻塞的，为BLOCKED状态。继续使用jvm查看jvm信息，发现有3个死锁。有死锁就好办了，直接用thread -b找到死锁的根源，发现指向一个日志收集器，里面有一个OpenFeign远程调用的地方发生了死锁。至此，成功发现死锁的根源。

这次的经验可以说是又复习了一遍jvm的知识，同时这个错误也很奇怪，因为日志收集器是所有模块都在用的，但是只有这个服务发生了死锁，这个目前还在找原因...

今天就是记录这一次发生的问题，肯定会对未来调优和排错有帮助，记录一下

