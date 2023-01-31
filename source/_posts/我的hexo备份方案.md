---
title: 我的hexo备份方案
tags:
  - hexo
categories:
  - 教程
cover: >-
  https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/0131/wallhaven-l885op_1920x1080.png
top_img: >-
  https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/0131/wallhaven-l885op_1920x1080.png
abbrlink: 3a5fd434
date: 2023-01-31 16:05:07
---

我们的hexo一般都是上传都github作为服务器，github里面存的都是编译好处理完成后的文件，而我们平时编辑博客则是需要在源码上完成。这会导致我们换一台电脑没有源码就编辑不了博客的问题。这次我来分享一下自己的hexo备份方案。原理很简单。在本地添加GIT，在上传之前把源码先提交推送到GITEE上。这样我们直接可以从GITEE上获取到源码

1. 在GITEE创建私人仓库 使用clone拉下来  将里面的.git文件夹直接拷贝到博客根目录

   <img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202301311609537.png" alt="image-20230131160902402" style="zoom: 50%;" />

2. 在根目录运行CMD，然后使用命令推送到GITEE上 这里我的远程分支名字叫master

```bash
git add .
git commit  -m  "描述"
git push -u origin master
```

3. 在GITEE上看到推送上去的源代码了

   <img src="https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202301311620836.png" alt="image-20230131162052737" style="zoom:50%;" />

4. 之后发布博客只需要多加三步操作即可。添加，提交，推送

```bash
hexo c
git add .
git commit -m "Backup"
git push
hexo g
hexo d
```

Tip：如果换了一台电脑 把GITEE上的源代码拉完之后执行 来完成hexo的安装

```bash
npm install hexo-cli
npm install
npm install hexo-deployer-git
```

