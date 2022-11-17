---
title: K8s搭建
tags: 
  - 运维
  - k8s
categories:
  - 教程
abbrlink: 1cd02af7
date: 2022-07-07 14:32:34
cover: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/Snipaste_2022-08-16_19-44-21.jpg
---

**安装方式**

> minikube  只有一个几点的集群 只为测试用 master和worker在一起
>
> 云平台 
>
> 重点**裸机安装** 

**开始搭建k8s集群**

- 三台服务器修改主机名称

```shell
hostnamectl set-hostname master
hostnamectl set-hostname node1
hostnamectl set-hostname node2
```

- 修改每台节点hosts文件

```shell
vim /etc/hosts

xxx.xxx.xxx.xxx master
xxx.xxx.xxx.xxx node1
xxx.xxx.xxx.xxx node2
```

- 所有节点关闭 setLinux

```shell
setenforce 0
sed -i --follow-symlinks 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/sysconfig/selinux
```

- 每个节点添加k8s数据源

```shell
# 添加 k8s 安装源
cat <<EOF > kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
mv kubernetes.repo /etc/yum.repos.d/

# 添加 Docker 安装源
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

- 如果安装docker数据源找不到yum-config

```shell
# 安装yum utils
yum -y install yum-utils
```

- 所有节点安装kubelet

```
yum install -y kubelet-1.22.4 kubectl-1.22.4 kubeadm-1.22.4 docker-ce
```

- 所有节点启动docker和kubelet 并设置开启自启

```shell
systemctl enable kubelet
systemctl start kubelet
systemctl enable docker
systemctl start docker
```

- kubernetes 官方推荐 docker 等使用 systemd 作为 cgroupdriver，否则 kubelet 启动不了

```shell
cat <<EOF > daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "registry-mirrors": ["https://ud6340vz.mirror.aliyuncs.com"]
}
EOF
mv daemon.json /etc/docker/
```

- 重新启动

```shell
# 重启生效
systemctl daemon-reload
systemctl restart docker
```

- 仅在**主节点**启动集群(正常流程命令只到google_containers)

```shell
kubeadm init --image-repository=registry.aliyuncs.com/google_containers --kubernetes-version v1.22.4 \ --service-cidr=10.96.0.0/16 \ 
--pod-network-cidr=10.244.0.0/16
```

```shell
kubectl get pods -A
# 正常流程出問題
vim /etc/kubernetes/manifests/kube-controller-manager.yaml
- --allocate-node-cidrs=true
- --cluster-cidr=10.244.0.0/16
systemctl restart kubelet
```

```shell
kubeadm join 172.24.218.55:6443 --token rzpzj2.cmjaqfk5dmt9dgyx \
        --discovery-token-ca-cert-hash sha256:65f35ea1c2b846ffa73b0c401cb8d4817f07c7fced5e27e7ae2098bd8271fb2c 
```

记得把 kubeadm join xxx 保存起来

 忘记了重新获取：kubeadm token create --print-join-command

 复制授权文件，以便 kubectl 可以有权限访问集群

在其他机器上创建 ~/.kube/config 文件也能通过 kubectl 访问到集群

- 主节点执行

```shell
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config
```

- 将2个从节点加入到主节点  直接在2个从服务器上执行刚刚的密钥 注意去掉【\】

```shell
kubeadm join 172.24.218.55:6443 --token rzpzj2.cmjaqfk5dmt9dgyx  --discovery-token-ca-cert-hash sha256:65f35ea1c2b846ffa73b0c401cb8d4817f07c7fced5e27e7ae2098bd8271fb2c 
```

- 查看节点状态

```shell
kubectl get node
```

![image-20220803203239304](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208032032364.png)

- 现在主节点是 NotReady 安装网络插件 解决

```shell
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

- 耐心等待几分钟

![image-20220803203517018](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208032035072.png)

**K8s集群搭建完成**

```shell
# 常用命令
# 获取当前运行的进程
kubectl get pod 
# 获取更详细信息
kubectl get pod -o wide
# 查看某一个pod的详细数据
kubectl describe pod pod名
# 查看日志
kubectl logs pod名 -f
# 进入容器
kubectl exec -it pod名 -- bash
```

- 每个服务器上直接运行

```shell
 # 先进入对应文件
 cd /run/flannel/
 # 写入文件
cat << EOF > subnet.env 
FLANNEL_NETWORK=10.244.0.0/16
FLANNEL_SUBNET=10.244.0.1/24
> FLANNEL_MTU=1450
> FLANNEL_IPMASQ=true
> EOF
```

```
docker run -d \
--restart=unless-stopped \
--name=kuboard \
-p 80:80/tcp \
-p 10081:10081/tcp \
-e KUBOARD_ENDPOINT="http://172.30.144.253:80" \
-e KUBOARD_AGENT_SERVER_TCP_PORT="10081" \
-v /root/kuboard-data:/data \
eipwork/kuboard:v3  
```

