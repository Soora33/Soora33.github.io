---
title: SpringBoot通过Ajax异步上传图片
tags:
  - Spring
  - Ajax
categories:
  - 教程
abbrlink: ed0abeea
top_img: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/spring.jpg
cover: https://minaseinori.oss-cn-hongkong.aliyuncs.com/blog/spring.jpg
date: 2019-11-27 13:11:54
---

由于之前使用的是SSM框架,使用的是自己的Tomcat,换上SpringBoot之后Tomcat就成内置的了,继续用以前的方法上传都上传在了随机位置,研究了一下图片上传和预览 记录一下
需要用到2个工具类(工具类也是从网上下载的),文末会附上工具类

首先我们要知道ajax上传需要的三个重要属性
cache: 默认值true 代表缓存 当设置为false的时候,再次发送请求,读的是浏览器的数据而不是之前缓存在浏览器中的数据 可以保证每次都是新的数据
processData: 是否序列化数据,默认值是true 代表将数据序列化,这里我们上传文件设置为false
contentType: 默认值application/x-www-form-urlencoded 是设置我们发送给服务器的数据格式，而常用的dataType则是设置我们收到服务器数据的格式
先来看一下前台页面,一个简单的上传图片按钮和一个下载按钮 js中是对应的函数

```html
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>图片上传</title>
    <link rel="stylesheet" href="../static/css3/css.css">
    <script src="../static/js/jquery-1.8.3.js"></script>
    <link rel="shortcut icon" href="/static/favicon.ico" type="image/x-icon">
</head>
<body>
    <table>
        <tr>
            <td>
                图片上传
                <input type="file" id="photo" onchange="upPic()">
                <img src="" alt="" id="img" width="135px">
                <input type="hidden" id="photoPath">
                <input type="button" value="下载图片" onclick="downloadPhoto()">
            </td>
        </tr>
    </table>
</body>
<script>
```


```javascript
// 上传图片
function upPic() {
    var fd = new FormData();
    fd.append("file",$("#photo").get(0).files[0])
    $.ajax({
        type: "post",
        url: "/user/upPic",
        data: fd,
        cache: false,
        processData: false,
        contentType: false,
        success (res) {
            // 赋值给img的src属性 实现预览图片
            $("#img").prop("src","/user/showImg?path="+res+"")
            // 将图片路径赋值给一个属性
            $("#photoPath").val(res)
        }
    })
}
```

```javascript
// 下载图片
function downloadPhoto() {
   location = "/user/download?path="+$("#photoPath").val();
}
```


一、上传图片
代码非常简单,我们只需要将file传到前台 交给工具类处理 返回String类型的图片路径 例D:/upload/2019112704222829e665e4482786fdcfaafd1af14be9a0.jpg
(注:这个工具类需要自行在D盘创建upload文件夹)

```java
  /**
     * 上传图片
     * @param multipartFile
     * @return
     */
    @RequestMapping("/upPic")
    @ResponseBody
    public String upPic(@RequestParam("file")MultipartFile multipartFile, HttpSession session) {
        return FileUploadUtils.upload(multipartFile, session);
    }
```

上传图片的工具类中我们可以看到先设置一个默认路径,之后对上传的文件进行后缀名校验，之后使用UUID随机生成字符串 上传到默认路径

```java
public static String upload(MultipartFile photo,HttpSession session) {
		String realPath ="";
		try {
			if(!photo.isEmpty()) {
				//String realPath = session.getServletContext().getRealPath("D:\\workspace\\upload\\");
				 realPath = "D:/upload/";
 

				String originalFilename = photo.getOriginalFilename();
 
				if(originalFilename.endsWith(".png")||originalFilename.endsWith(".jpg")||originalFilename.endsWith(".jpeg")||originalFilename.endsWith(".mp4")) {
					String replace = UUID.randomUUID().toString().replace("-", "");
 
//					SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMddhhmmss");
//					String replace = dateFormat.format(new Date());
 
					String filename = replace+originalFilename;
					File file = new File(realPath,filename);
					photo.transferTo(file);
					realPath += filename;
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return realPath;
```

**二、展示图片**
在前台 将图片中的src属性设置为 调用后台的showImg方法

```java
 /**
     * 展示图片
     * @param path
     * @param response
     */
    @RequestMapping("/showImg")
    public void showImg(String path, HttpServletResponse response) {
        FileUploadUtils.showImg(path, response);
    }
```

```javascript
// 赋值给img的src属性 实现预览图片
$("#img").prop("src","/user/showImg?path="+res+"")
```

通过IO流的方式读取路径上的图片

```java
public static void showImg(String path, HttpServletResponse response){
		if(path!=null&&!path.equals("")){
			try {
				FileInputStream fis = new FileInputStream(path);
				ServletOutputStream os = response.getOutputStream();
 
				byte [] b = new byte[1024*8];
				while(fis.read(b)!=-1){
					os.write(b);
				}
			} catch (FileNotFoundException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}
```
**三、下载图片**
调用FileDownLoad图片下载工具类,使用IO流下载到浏览器默认目录 

```java
/**
     * 下载图片
     * @param path
     * @param response
     */
    @RequestMapping("/download")
    public void download(String path, HttpServletRequest request, HttpServletResponse response) {
        try {
            FileDownLoad.download(path, request, response)
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
```

**两个工具类 **
图片上传工具类

```java
package com.sora.utils;
 
import org.springframework.web.multipart.MultipartFile;
 
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.UUID;
 
public class FileUploadUtils {
	
	
	public static String upload(MultipartFile photo,HttpSession session) {
		String realPath ="";
		try {
			if(!photo.isEmpty()) {
				//String realPath = session.getServletContext().getRealPath("D:\\workspace\\upload\\");
				 realPath = "D:/upload/";
 
				
				String originalFilename = photo.getOriginalFilename();
 
				if(originalFilename.endsWith(".png")||originalFilename.endsWith(".jpg")||originalFilename.endsWith(".jpeg")||originalFilename.endsWith(".mp4")) {
					String replace = UUID.randomUUID().toString().replace("-", "");
 
//					SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMddhhmmss");
//					String replace = dateFormat.format(new Date());
 
					String filename = replace+originalFilename;
					File file = new File(realPath,filename);
					photo.transferTo(file);
					realPath += filename;
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return realPath;
	}
 
	public static void showImg(String path, HttpServletResponse response){
		if(path!=null&&!path.equals("")){
 
		try {
			FileInputStream fis = new FileInputStream(path);
			ServletOutputStream os = response.getOutputStream();
 
			byte [] b = new byte[1024*8];
			while(fis.read(b)!=-1){
				os.write(b);
			}
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
		}
	}
 
}
```

图片下载工具类

```java
package com.sora.utils;
 
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URLEncoder;
 
public class FileDownLoad {
 
	public static String download(String filepath,HttpServletRequest request, HttpServletResponse response) throws Exception{
 
		BufferedInputStream bis = null;
		BufferedOutputStream bos = null;
		OutputStream fos = null;
		InputStream fis = null;
 
		try {
			//String filepath = request.getRealPath(filepatha);
			//String filepathall = request.getSession().getServletContext().getRealPath(filepath);
 
			File uploadFile = new File(filepath);
 
			fis = new FileInputStream(uploadFile);
			bis = new BufferedInputStream(fis);
			fos = response.getOutputStream();
			bos = new BufferedOutputStream(fos);
 
			String filename = filepath.substring(filepath.lastIndexOf("\\")+1);
 
			response.setHeader("Content-disposition", "attachment;filename="+ URLEncoder.encode(filename, "utf-8"));
 
			int bytesRead = 0;
			byte[] buffer = new byte[8192];
			while ((bytesRead = bis.read(buffer, 0, 8192)) != -1) {
				bos.write(buffer, 0, bytesRead);
			}
 
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		} catch (NumberFormatException e) {
			e.printStackTrace();
		} finally {
			try {
				if (bos != null) {
					bos.flush();
				}
				if (fis != null) {
					fis.close();
				}
				if (bis != null) {
					bis.close();
				}
				if (fos != null) {
					fos.close();
				}
				if (bos != null) {
					bos.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		return null;
	}
}
```

