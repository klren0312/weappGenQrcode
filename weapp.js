import got from 'got'

export default class Weapp {
    appid = ''
    secret = ''
    accessToken = ''
    accessTokenTimestamp = ''
    constructor(appid, secret) {
        this.appid = appid
        this.secret = secret
    }

    /**
     * 小程序登录
     * @param {*} code 小程序登录code
     */
    async doWeappLogin (code) {
        const res = await got.post('https://api.weixin.qq.com/sns/jscode2session', {
            searchParams: {
                appid: this.appid,
                secret: this.secret,
                js_code: code,
                grant_type: 'authorization_code'
            }
        }).json()
        return res
    }

    /**
     * 获取小程序用户手机号
     * @param {``} code 小程序手机号code
     */
    async getWeappPhone(code) {
        const accessToken = await this.getAccessToken()
        const res = await got.post(`https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`, {
            json: {
                code
            }
        }).json()
        return res

    }
    
    /**
     * 获取小程序二维码
     * @param {*} config scene page
     * @returns 二维码数据
     */
    async getWeappQrcode (config) {
        const accessToken = await this.getAccessToken()
        const res = await got.post('https://api.weixin.qq.com/wxa/getwxacodeunlimit', {
            searchParams: {
                access_token: accessToken
            },
            json: {
                scene: config.scene,
                page: config.page,
                check_path: false,
                // 正式版为 "release"，体验版为 "trial"，开发版为 "develop"。默认是正式版。
                env_version: 'develop'
            },
            responseType: 'buffer'
        })
        const buffer = res.body
        const base64 = buffer.toString('base64')
        return {
            code: 0,
            data: {
                qrcode: `data:image/*;base64,${base64}`
            }
        }
    }
    
    /**
     * 获取微信accesstoken
     */
    async getAccessToken() {
        // 没超过两小时 不请求token
        if (this.checkTimeDifference()) {
            return this.accessToken
        }
        const res = await got.get('https://api.weixin.qq.com/cgi-bin/token', {
            searchParams: {
                grant_type: 'client_credential',
                appid: this.appid,
                secret: this.secret
            }
        }).json()
        this.accessTokenTimestamp = this.getCurrentTimestamp()
        this.accessToken = res.access_token
        return this.accessToken
        
    }
    
    
    /**
     * 获取当前时间戳
     */
    getCurrentTimestamp() {
        return Math.floor(Date.now() / 1000) // 以秒为单位
    }
    /**
     * 判断当前时间戳是否与token时间戳间隔超过两小时
     * 超过返回false 没超过返回true
     */
    checkTimeDifference() {
        if (!this.accessTokenTimestamp) {
            return false
        }
        const currentTimestamp = this.getCurrentTimestamp()
        const diffInSeconds = currentTimestamp - this.accessTokenTimestamp
        const maxDiffInSeconds = 2 * 60 * 60 // 两个小时的秒数

        return diffInSeconds <= maxDiffInSeconds
    }
}