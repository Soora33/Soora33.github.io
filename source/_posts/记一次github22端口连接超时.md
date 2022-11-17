---
title: 记一次github22端口连接超时
categories:
  - 踩坑记录
cover: >-
  https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/0826/wallhaven-z8l7rg_1920x1080.png
top_img: >-
  https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/0826/wallhaven-z8l7rg_1920x1080.png
abbrlink: 27c06239
date: 2022-08-26 08:54:47
tags:
---

今天一大早发现github的文件推不上去，错误如下，提示22端口连接超时。寻思着前几天也好好的，科学上网也开了，就是连不上。

![image-20220826085715285](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208260857354.png)

解决办法也很简单，我们只需要将`22`改为`443`就可以

首先我们使用下面这条命令来看一下是否能连接上github

```shell
ssh -T git@github.com
```

![image-20220826090317225](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208260903262.png)

连接不上，还是超时。现在我们去.ssh文件夹下新建config文件**(注意没有后缀名)**，开始修改端口号

![image-20220826090423726](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208260904770.png)

config文件里配置好我们的参数

```shell
Host github.com
User MyEmail(邮箱)
Hostname ssh.github.com
PreferredAuthentications publickey
IdentityFile ~/.ssh/id_rsa
Port 443
```

再次使用命令查看是否可以连接上

```
ssh -T git@github.com
```

![image-20220826090557729](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208260905765.png)

问题解决
