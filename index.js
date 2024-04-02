import express from 'express'
import Weapp from './weapp.js'
import WeappConfig from './config.js'
import { expressjwt } from 'express-jwt'
import jwt from 'jsonwebtoken'
const weapp = new Weapp(WeappConfig.appid, WeappConfig.secret)

const app = express()
app.use(express.static('public'))
app.use(express.json())

// 设置 CORS 跨域头信息
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // '*' 表示允许任何源进行跨域请求，也可以替换为具体的域名
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS') // 允许的 HTTP 方法
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization') // 允许自定义请求头，例如 Content-Type 和 Authorization
  res.setHeader('Access-Control-Allow-Credentials', true) // 允许携带 cookie 进行跨域请求

  // 对于预检OPTIONS请求，直接返回204
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
  } else {
    next()
  }
})

app.use('/wapi', expressjwt({
  secret: WeappConfig.jwtSecret,
  algorithms:['HS256']
}))

// 全局错误处理中间件，捕获解析JWT失败产生的错误
app.use((err,req,res,next)=>{
  // token解析失败
  if(err.name==='UnauthorizedError'){
    return res.send({
      status: 401,
      message: '无效token'
    })
  }
  // 其他错误
  res.send({ status: 500,message: '未知错误' })
})

// 小程序登录
app.get('/login', async (req, res) => {
  const code = req.query.code
  const result = await weapp.doWeappLogin(code)
  res.json({
    code: 0,
    data: {
      ...result,
      token: 'Bearer ' + jwt.sign({
        openid: result.openid
      }, WeappConfig.jwtSecret, {
        expiresIn: '24h'
      })
    }
  })
})

// 小程序获取手机号
app.get('/api/v1/weapp/phone', async (req, res) => {
  const code = req.query.code
  console.log(req)
  const result = await weapp.getWeappPhone(code)
  res.json({
    code: 0,
    data: result
  })
})

// 小程序二维码生成
app.post('/api/v1/weapp/qrcode', async (req, res) => {
  const data = req.body
  const { scene, page } = data
  const result = await weapp.getWeappQrcode({
    scene,
    page
  })
  console.log(result)
  res.json(result)
})


app.listen(8877, () => {
  console.log('server is running 8877')
})
