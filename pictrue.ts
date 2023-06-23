import { plugin, Messagetype } from 'alemon'
import { createCanvas, loadImage } from 'canvas'
import GIFEncoder from 'gifencoder'
import { createWriteStream, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import axios from 'axios'
import GifFrames from 'gif-frames'

const imgDir = join(process.cwd(), '/data/pucture')
export class picture extends plugin {
  constructor() {
    super({
      rule: [
        {
          reg: '^/旋转$',
          fnc: '旋转'
        },
        {
          reg: '^/左对称$',
          fnc: '对称'
        },
        {
          reg: '^/右对称$',
          fnc: '对称'
        },
        {
          reg: '^/上对称$',
          fnc: '对称'
        },
        {
          reg: '^/下对称$',
          fnc: '对称'
        },
        {
          reg: '^/去色$',
          fnc: '去色'
        },
        {
          reg: '^/线稿$',
          fnc: '去色'
        }
      ]
    })
  }

  async 旋转(e: Messagetype) {
    const img = await getImg(e)
    if (!img) {
      return
    }

    const image = await loadImage(encodeURI(img))
    const width = image.width
    const height = image.height
    const centerX = width / 2
    const centerY = height / 2
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const encoder = new GIFEncoder(width, height)

    mkdirSync(imgDir, { recursive: true })
    const file = encoder.createReadStream().pipe(createWriteStream(join(imgDir, '旋转.gif')))
    encoder.start()
    encoder.setRepeat(0)
    encoder.setDelay(50)
    encoder.setQuality(10)

    for (let i = 0; i < 360; i = i + 30) {
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate((i * Math.PI) / 180)

      ctx.drawImage(image, -centerX, -centerY, width, height)
      ctx.restore()
      // @ts-ignore
      encoder.addFrame(ctx)
    }
    encoder.finish()

    return file.on('finish', async () => {
      return e.sendImage(join(imgDir, '旋转.gif')).catch(err => err)
    })
  }

  async 对称(e: Messagetype) {
    const img = await getImg(e)
    if (!img) {
      return
    }

    const image = await loadImage(encodeURI(img))

    const canvas = createCanvas(image.width, image.height)

    const ctx = canvas.getContext('2d')

    let imgPath = ''

    //   图片对象：要绘制的图片对象，可以是Image、Canvas或Video对象。
    // 平移宽度：要绘制的图片在画布上的x坐标。
    // 平移高度：要绘制的图片在画布上的y坐标。
    // 绘制宽度：要绘制的图片在画布上的宽度。
    // 绘制高度：要绘制的图片在画布上的高度。
    // 目标x坐标：绘制后的图片在画布上的x坐标。
    // 目标y坐标：绘制后的图片在画布上的y坐标。
    // 目标宽度：绘制后的图片在画布上的宽度。
    // 目标高度：绘制后的图片在画布上的高度。

    if (e.cmd_msg === '/左对称') {
      ctx.drawImage(
        image,
        0,
        0,
        image.width / 2,
        image.height,
        0,
        0,
        canvas.width / 2,
        canvas.height
      )
      ctx.scale(-1, 1)

      ctx.drawImage(
        image,
        0,
        0,
        image.width / 2,
        image.height,
        -image.width,
        0,
        canvas.width / 2,
        canvas.height
      )

      imgPath = join(imgDir, '左对称.jpg')
    } else if (e.cmd_msg === '/右对称') {
      ctx.drawImage(
        image,
        image.width / 2,
        0,
        image.width / 2,
        image.height,
        image.width / 2,
        0,
        canvas.width / 2,
        canvas.height
      )
      ctx.scale(-1, 1)
      ctx.drawImage(
        image,
        image.width / 2,
        0,
        image.width / 2,
        image.height,
        -image.width / 2,
        0,
        canvas.width / 2,
        canvas.height
      )

      imgPath = join(imgDir, '右对称.jpg')
    } else if (e.cmd_msg === '/上对称') {
      ctx.drawImage(
        image,
        0,
        0,
        image.width,
        image.height / 2,
        0,
        0,
        canvas.width,
        canvas.height / 2
      )
      ctx.scale(1, -1)
      ctx.drawImage(
        image,
        0,
        0,
        image.width,
        image.height / 2,
        0,
        -image.height,
        canvas.width,
        canvas.height / 2
      )

      imgPath = join(imgDir, '上对称.jpg')
    } else if (e.cmd_msg === '/下对称') {
      ctx.scale(1, -1)
      ctx.drawImage(
        image,
        0,
        image.height / 2,
        image.width,
        image.height / 2,
        0,
        -image.height / 2,
        canvas.width,
        canvas.height / 2
      )
      ctx.scale(1, -1)
      ctx.drawImage(
        image,
        0,
        image.height / 2,
        image.width,
        image.height / 2,
        0,
        image.height / 2,
        canvas.width,
        canvas.height / 2
      )

      imgPath = join(imgDir, '下对称.jpg')
    }

    mkdirSync(imgDir, { recursive: true })
    const out = createWriteStream(imgPath)

    const stream = canvas.createJPEGStream()

    stream.pipe(out)
    return out.on('finish', () => {
      return e.sendImage(imgPath)
    })
  }

  async 去色(e: Messagetype) {
    const img = await getImg(e)
    if (!img) {
      return
    }

    const res = await axios.get(img, { responseType: 'arraybuffer' })。catch(err => err)
    if (!res) {
      return
    }

    // 获取图片类型
    const type = res.headers['content-type']
    if (type === 'image/gif') {
      const inputFilePath = res.data
      const outputFilePath =
        e.cmd_msg === '/去色' ? join(imgDir, './去色.gif') : join(imgDir, './线稿.gif')

      const gifFrames = await GifFrames({ url: inputFilePath, frames: 'all' })
      const encoder = new GIFEncoder(gifFrames[0]。frameInfo。width, gifFrames[0]。frameInfo。height)
      const canvas = createCanvas(gifFrames[0]。frameInfo。width, gifFrames[0]。frameInfo。height)
      const ctx = canvas.getContext('2d')
      mkdirSync(dirname(outputFilePath)， { recursive: true })
      const file = encoder.createReadStream()。pipe(createWriteStream(outputFilePath))

      encoder.start()
      encoder.setRepeat(0)
      encoder.setDelay(100)
      encoder.setQuality(10)

      for (const frame of gifFrames) {
        ctx.drawImage(await loadImage(frame.getImage()。_obj)， 0， 0)

        const imageData = ctx.getImageData(0， 0, canvas.width, canvas.height)
        const pixels = imageData.data

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]

          if (e.cmd_msg === '/去色') {
            const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b

            pixels[i] = gray
            pixels[i + 1] = gray
            pixels[i + 2] = gray
          } else {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b // 灰度值
            const bw = gray > 128 ? 255 : 0 // 黑白值
            pixels[i] = pixels[i + 1] = pixels[i + 2] = bw // 设置像素值
          }
        }

        ctx.putImageData(imageData, 0， 0)
        //@ts-ignore
        encoder.addFrame(ctx)
      }
      encoder.finish()

      return file.于('finish'， async () => {
        return e
          。sendImage(
            e.cmd_msg === '/去色' ? join(imgDir, './去色.gif') : join(imgDir, './线稿.gif')
          )
          。catch(err => err)
      })
    } else {
      // 加载图片
      const image = await loadImage(encodeURI(img))
      // 创建画布
      const canvas = createCanvas(image.width, image.height)
      const ctx = canvas.getContext('2d')

      // 将图片绘制到画布上
      ctx.drawImage(image, 0， 0)

      // 获取画布上每个像素的颜色值
      const imageData = ctx.getImageData(0， 0, canvas.width, canvas.height)
      const pixels = imageData.data

      // 遍历每个像素，将其颜色值设置为灰度值
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        if (e.cmd_msg === '/去色') {
          const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b

          pixels[i] = gray
          pixels[i + 1] = gray
          pixels[i + 2] = gray
        } else {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b // 灰度值
          const bw = gray > 128 ? 255 : 0 // 黑白值
          pixels[i] = pixels[i + 1] = pixels[i + 2] = bw // 设置像素值
        }
      }

      // 将处理后的像素数据重新绘制到画布上
      ctx.putImageData(imageData, 0， 0)

      // 将画布转换为Buffer对象
      const buffer = canvas.toBuffer()

      return e.postImage(buffer)
    }
  }
}
// 获取图片
async function getImg(e: Messagetype) {
  const eventType = e.eventId。split(':')[0]
  if (eventType !== 'MESSAGE_CREATE' && eventType !== 'AT_MESSAGE_CREATE') {
    await e.reply('请在子频道发送')
    return false
  }

  if (e.msg。attachments) {
    return 'https://' + e.msg。attachments[0]。url
  } else if (e.msg。message_reference && e.msg。message_reference。message_id) {
    let { data } = await client.messageApi。message(
      e.msg。channel_id，
      e.msg。message_reference。message_id
    )
    if (data && data.message && data.message。attachments) {
      return 'https://' + data.message。attachments[0]。url
    } else {
      await e.reply('回复信息没有获取到图片')
      return false
    }
  } else {
    await e.reply('请发送带图片的消息或回复带图片的消息')
    return false
  }
}
