
## 常规
访问 ```http://localhost:33001/@manage```，填写口令即可进入后台管理。

### 后台管理
设置后台管理密码。默认 ```sharelist```。

### 网站标题
设置网站标题。

### 目录索引
默认启用。如果只提供下载功能，可禁用此项。

### 展开单一挂载盘
默认启用。如果只有一个挂载盘，将默认展开。

### 允许下载
默认启用。

### 忽略路径
设置禁止访问的目录/文件路径。支持 [gitignore](http://git-scm.com/docs/gitignore) 表达式

### 加密文件名
默认```.passwd```，修改此项自定义加密文件名。

### WebDAV 路径
WebDAV路径。

### WebDAV 代理
默认启用。

### WebDAV 用户
默认 ```admin```。

### WebDAV 密码
默认 ```sharelist```。

### 自定义脚本
默认主题支持自定义脚本。可用于插入统计脚本。

### 自定义样式
默认主题支持自定义样式。


## 高级用法
在需加密目录内新建 ```.passwd``` 文件（此项可修改），```type```为验证方式，```data```为验证内容。  
例如：    
```yaml
type: basic
data:
  - 123456
  - abcdef
``` 

可使用密码```123456```，```abcdef```验证。

***

### 获取文件夹ID
保持后台登录状态，回到首页列表，点击文件夹后的 '!' 按钮 可查看文件夹ID。   

***

### 反向代理
使用反代时，请添加以下配置。  

#### Nginx  
```ini 
  proxy_set_header Host  $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  proxy_set_header Range $http_range;
  proxy_set_header If-Range $http_if_range;
  proxy_no_cache $http_range $http_if_range;
```   
如果使用上传功能，请调整 nginx 上传文件大小限制。   
```
  client_max_body_size 8000m;
```   
#### Caddy   
```ini
  header_upstream Host {host}
  header_upstream X-Real-IP {remote}
  header_upstream X-Forwarded-For {remote}
  header_upstream X-Forwarded-Proto {scheme}
```