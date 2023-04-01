---
title: 将hexo部署到云服务器
abbrlink: a6738ead
date: 2023-03-12 10:12:26
tags:
hidden: true
---

## 安装Git和nginx



## 创建仓库

选择一个路径，创建博客的文件夹，这里我选择用户目录下创建repo文件夹，创建完成后赋值2个权限，进入repo目录，创建一个远程仓库

```shell
chown -R root:root repo

chmod -R 755 repo

git init --bare sora33Hexo.git
```

