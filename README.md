# <div align="center">Alemon-TS 插件</div>

根据发送的图片或回复信息的图片生成图片

## 前置要求

1、在 Alemon 项目根目录创建 `.npmrc`

```npm
canvas_binary_host_mirror=https://ghproxy.com/https://github.com/Automattic/node-canvas/releases/download/
```

2、如果是 linux

解决 version `CXXABI_1.3.9‘ not found (required by /home/报错问题

https://blog.csdn.net/weixin_39643007/article/details/120533472

解决 “/lib64/libc.so.6: version `GLIBC_2.18‘ not found (required by /lib64/libstdc++.so.6)

https://blog.csdn.net/weixin_39643007/article/details/120527897

3、 安装依赖

```sh
npm i canvas
```

```sh
npm i gifencoder gif-frames
```

```sh
npm i @types/gifencoder -D
```

## 命令

| 命令    | 说明           |
| ------- | -------------- |
| /旋转   | 生成旋转的图片 |
| /左对称 | 生成左对称图片 |
| /右对称 | 生成右对称图片 |
| /上对称 | 生成上对称图片 |
| /下对称 | 生成下对称图片 |
| /去色   | 生成去色图片   |
| /线稿   | 生成线稿图片   |
