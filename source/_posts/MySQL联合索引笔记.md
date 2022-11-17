---
title: MySQL联合索引笔记
tags:
  - MySQL
  - 数据库
  - 索引
categories:
  - 技术学习
cover: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/wallhaven-j3gmrw_1920x1080.png
top_img: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/wallhaven-j3gmrw_1920x1080.png
abbrlink: bfce4318
date: 2022-05-20 20:11:27
---

**什么是联合索引?**

联合索引指的是在一个表上，多个列加起来组成的一个索引。使用联合索引匹配的时候，首先会匹配第一个，如果匹配成功，会继续匹配第二个，依次类推。

**最左前缀原则?**

我们要使用联合索引，就必须要遵守最左前缀规则，最左前缀指的是查询的时候会从最左的索引开始匹配。比如现在age和name字段是一个联合索引，现在使用select id,name from user where name = '张三'进行查询,因为这条SQL没有对age进行条件查询，而age又是联合索引的第一个。没有满足最左前缀原则，所以这条SQL绝对不会使用联合索引。

**实战测试**

> MySQL版本为5.7

创建一张测试表，插入AA、BB、CC列的联合索引

```sql
-- ----------------------------
-- Table structure for index_test
-- ----------------------------
DROP TABLE IF EXISTS `index_test`;
CREATE TABLE `index_test`  (
  `TID` bigint(20) NOT NULL AUTO_INCREMENT,
  `AA` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `BB` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `CC` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `DD` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TID`) USING BTREE,
  INDEX `INDEX_COMP`(`AA`, `BB`, `CC`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of index_test
-- ----------------------------
INSERT INTO `index_test` VALUES (1, 'A1', 'B1', 'C1', 'D1', '2022-07-28 18:55:59');
INSERT INTO `index_test` VALUES (2, 'A2', 'B2', 'C2', 'D2', '2022-07-28 18:55:59');
INSERT INTO `index_test` VALUES (3, 'A3', 'B3', 'C3', 'D3', '2022-07-28 18:55:59');
INSERT INTO `index_test` VALUES (4, 'A4', 'B4', 'C4', 'D4', '2022-07-28 18:55:59');
INSERT INTO `index_test` VALUES (5, 'A5', 'B5', 'C5', 'D5', '2022-07-28 18:55:59');
INSERT INTO `index_test` VALUES (6, 'A6', 'B6', 'C6', 'D6', '2022-07-28 18:55:59');
INSERT INTO `index_test` VALUES (7, 'A7', 'B7', 'C7', 'D7', '2022-07-28 18:55:59');
INSERT INTO `index_test` VALUES (8, 'A8', 'B8', 'C8', 'D8', '2022-07-28 18:55:59');
INSERT INTO `index_test` VALUES (9, 'A9', 'B9', 'C9', 'D9', '2022-07-28 18:55:59');
INSERT INTO `index_test` VALUES (10, 'A10', 'B10', 'C10', 'D10', '2022-07-28 18:55:59');

SET FOREIGN_KEY_CHECKS = 1;
```

使用6条SQL语句进行测试

```sql
EXPLAIN
SELECT * FROM index_test WHERE AA = 'A1';

EXPLAIN
SELECT * FROM index_test WHERE AA = 'A1' AND BB = 'B1';

EXPLAIN
SELECT * FROM index_test WHERE AA = 'A1' AND BB = 'B1' AND CC = 'C1';

EXPLAIN
SELECT * FROM index_test WHERE CC = 'A1' AND AA = 'B1' AND BB = 'C1';

EXPLAIN
SELECT * FROM index_test WHERE AA = 'A1' AND CC = 'B1';

EXPLAIN
SELECT * FROM index_test WHERE BB = 'A1';
```

我们先执行第一条，使用到了联合索引，命中了联合索引的AA列，索引长度是202 

![image-20220817113525726](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171135776.png)

执行第二条SQL，继续加一个BB列的条件，这次又多命中了一个BB的列，长度自然为404

![image-20220817113701562](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171137608.png)

第三条，自然就是606 到这里都没有任何问题

![image-20220817113823101](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171138146.png)

接下来，我们打乱顺序，还是可以命中联合索引，并且全部匹配到了。这是因为MySQL底层的优化器会自动帮助我们排序

![image-20220817113848352](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171138399.png)

这个查询条件有AA和CC 但是最左前缀到BB就断掉了，所以只命中了AA列的索引，长度为202

![image-20220817114159306](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171141353.png)

最后一条，肯定不会走索引，因为第一条都没匹配上

![image-20220817114324120](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171143168.png)

**BETWEEN AND对于联合索引的影响**
目前共有10条数据

![image-20220817115230777](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171152834.png)

我们来看这条SQL语句 查询出了3条

![image-20220817115409426](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171154472.png)

对应的执行计划，发现命中了联合索引，类型是范围查询

![image-20220817115431104](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171154149.png)

再来看这条SQL，查询出了4条

![image-20220817115515428](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171155475.png)

对应的执行计划

![image-20220817115528181](https://minaseinori.oss-cn-hongkong.aliyuncs.com/%E6%95%99%E5%AD%A6%E7%9B%AE%E5%BD%95/202208171155229.png)

奇怪?，为什么同样的索引，4条数据不走索引，3条就走索引。到网上翻了一些资料，发现和查询出的数据量有关系。这里我总结的是如果查询出的数据量 >= 40% 那么就不会走索引 反之走索引，因为SQL底层优化器认为走全表查询比索引查询的效率快，所以索引就失效了。平时一定要注意这些小细节

**总结**

1. 使用联合索引必须要匹配最左前缀原则
2. 查询的条件顺序可以乱序，底层执行器会帮我们自动排序
3. 联合索引可以帮助我们减少索引的开销，将原本多个索引和合到了一个上面
4. 范围查询要注意查询出的结果量
