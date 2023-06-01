import { plugin, Messagetype } from 'alemon'
import { createCanvas, loadImage } from 'canvas'
import GIFEncoder from 'gifencoder'
import { createWriteStream, mkdirSync } from 'node:fs'
import { join } from 'node:path'

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
}
// 获取图片
async function getImg(e: Messagetype) {
  const eventType = e.eventId.split(':')[0]
  if (eventType !== 'MESSAGE_CREATE' && eventType !== 'AT_MESSAGE_CREATE') {
    await e.reply('请在子频道发送')
    return false
  }

  if (e.msg.attachments) {
    return 'https://' + e.msg.attachments[0].url
  } else if (e.msg.message_reference && e.msg.message_reference.message_id) {
    let { data } = await client.messageApi.message(
      e.msg.channel_id,
      e.msg.message_reference.message_id
    )
    if (data && data.message && data.message.attachments) {
      return 'https://' + data.message.attachments[0].url
    } else {
      await e.reply('回复信息没有获取到图片')
      return false
    }
  } else {
    await e.reply('请发送带图片的消息或回复带图片的消息')
    return false
  }
}
