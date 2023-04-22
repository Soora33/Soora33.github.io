---
title: Linux安装Docker和MySQL
tags:
  - linux
  - Docker
  - 服务器
  - MySQL
categories:
  - 教程
abbrlink: '2733575'
date: 2021-04-20 19:30:10
---

1.安装准备


```shell
    1.1 确保cenos版本是7.X
```

使用uanme -a查看docker内核版本

```shell
uname -a
```

![image-20220817132536108](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171325155.png)

这里使用cenos7来安装docker

```shell
    1.2 安装docker运行环境
```

安装docker运行环境之前,我们先来配置一下yum

2.配置yum
        2.1 备份

```shell
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
```

​        2.2 配置国内镜像加速

```shell
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
```

​        2.3 生成缓存

```shell
yum makecache
```

​        2.4 安装docker运行环境
​        		因为docker是基于C和C++开发的 需要安装对应的环境

```shell
yum -y install gcc
yum -y install gcc-c++
```

​        2.5 继续安装docker需要的工具

```shell
yum install -y yum-utils device-mapper-persistent-data lvm2
```

​        2.6 设置yum镜像仓库

```shell
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

​        2.7 更新索引 大功告成

```shell
yum makecache fast
```

3.Docker的安装
        3.1 卸载之前的docker,如果没安装过docker可以忽略

```shell
yum -y remove docker docker-common docker-selinux docker-engine
```

​        3.2 安装docker-ce 社区版

```shell
yum -y install docker-ce docker-ce-cli containerd.io
```

​    PS：这里需要注意一下，我在23年4月22的时候安装docker的时候，发现有个依赖一直下不下来，需要我们手动改一下文件，文件地是/etc/yum.repos.d/docker-ce.repo。将[docker-ce-test]中的enabled=0改为enabled=1就可以了

​	   3.3 启动docker

```shell
systemctl start docker
```

使用docker -v 查看docker版本,出现版本号表示Docker安装完毕

​	   3.4 创建docker目录

```shell
mkdir /usr/local/docker
```

4.安装mysql
        4.1 创建mysql目录及挂载文件夹

我们在刚刚创建的docker目录中创建mysql文件夹 里面继续创建2个文件夹  分别为config和data

进入config中创建并配置my.cnf文件 直接复制下面代码即可

```shell
[client]
# 端口号
port=3306
 
[mysql]
no-beep
default-character-set=utf8mb4
 
[mysqld]
# 端口号
port=3306
# 数据目录
datadir=/var/lib/mysql
# 新模式或表时将使用的默认字符集
character-set-server=utf8mb4
# 默认存储引擎
default-storage-engine=INNODB
# 将 SQL 模式设置为严格
sql-mode="STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"
#  最大连接数
max_connections=1024
# 表缓存
table_open_cache=2000
# 表内存
tmp_table_size=16M
# 线程缓存
thread_cache_size=10
 
# myisam设置
myisam_max_sort_file_size=100G
myisam_sort_buffer_size=8M
key_buffer_size=8M
read_buffer_size=0
read_rnd_buffer_size=0
 
# innodb设置
innodb_flush_log_at_trx_commit=1
innodb_log_buffer_size=1M
innodb_buffer_pool_size=8M
innodb_log_file_size=48M
innodb_thread_concurrency=33
innodb_autoextend_increment=64
innodb_buffer_pool_instances=8
innodb_concurrency_tickets=5000
innodb_old_blocks_time=1000
innodb_open_files=300
innodb_stats_on_metadata=0
innodb_file_per_table=1
innodb_checksum_algorithm=0
# 其他设置
back_log=80
flush_time=0
join_buffer_size=256K
max_allowed_packet=4M
max_connect_errors=100
open_files_limit=4161
sort_buffer_size=256K
table_definition_cache=1400
binlog_row_event_max_size=8K
sync_master_info=10000
sync_relay_log=10000
sync_relay_log_info=10000
```

编辑完成后保存退出 使用冒号+wq!保存退出

 4.2 下载mysql镜像 (已5.7版本为例)

```shell
docker pull mysql:5.7
```

 下载完成后 编写mysql安装脚本

> -d 后台运行
>
> --privileged=true 使容器拥有真正的root权限
>
> -- name 设置容器名字
>
> -p 端口号(主机端口号):端口号(容器内端口号) 这里将容器内的3306端口号映射到主机上的5508端口,外部访问的时候需要访问5508端口,隐藏了端口号
>
> -v 挂载 将容器内的目录(:后面的目录)挂载到本机指定目录(:前面的目录) 以后修改mysql配置文件时 直接修改挂载的文件即可 可以理解为window系统中的快捷方式
>
> -e 初始化root用户的密码

```shell
docker run -d \
--privileged=true \
--name mysql57 \
-p 5508:3306 \
--restart=always \
-v /usr/local/docker/mysql/data:/var/lib/mysql \
-v /usr/local/docker/mysql/config/my.cnf:/etc/mysql/my.cnf \
-e MYSQL_ROOT_PASSWORD=root mysql:5.7 \
```

​         4.3 执行安装脚本
​			先给安装脚本执行权限

```shell
chmod -R 700 startMysql.sh
```

执行安装脚本,返回一个容器id

![image-20220817132907269](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171329310.png)

使用docker ps查看正在运行的容器

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171329830.png)

 5连接mysql
这里很多激动的小伙伴就开始连接mysql了 一连接发现失败,就开始着急了,是不是刚刚哪里错了?

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171329366.png)

 其实不然,我们首先检查系统的防火墙设置

 使用systemctl命令来查看防火墙的状态

```shell
systemctl status firewalld
```

 很明显亮着绿灯,表示我们的防火墙是开着的

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171329064.png)

我们有2种方法连接上数据库 

1: 是关闭防火墙 使用systemctl stop firewalld关闭防火墙

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171329797.png)

 连接成功

![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171330780.png)

2: 是在系统防火墙加入端口号到白名单

 确保防火墙是开着的

 将我们刚刚设置的端口加入白名单

> –zone=public表示作用域是公共的
> –add-port=5508/tcp添加tcp协议的端口号为5508
> –permanent是永久生效,不加入此参数重启后失效

```shell
 firewall-cmd --zone=public --add-port=5508/tcp --permanent
```

务必刷新防火墙,加载刚刚设置的白名单

```shell
firewalld-cmd --reload
```

 查看白名单中的端口号

```shell
firewall-cmd --list-port
```


 连接成功

 ![img](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171330014.png)

如果想要从防火墙中移除指定端口号 只需要将加入时的命令add改为remove即可

linux下安装docker和mysql就完成了。
