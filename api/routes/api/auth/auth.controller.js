const jwt = require('jsonwebtoken')

exports.login = (req, res) => {
    const {password} = req.body
    const secret = req.app.get('jwt-secret')
    if (password !== "wlsdhks2@@") {
        return res.status(403).json({
            message: 'password error'
        })
    }

    const makeToken = async () => {
        const p = new Promise((resolve, reject) => {
            jwt.sign(
                {
                    admin: true,
                    password: password
                }, 
                secret, 
                {
                    expiresIn: '7d',
                    issuer: 'keinchronicle',
                    subject: 'admin'
                }, (err, token) => {
                    if (err) reject(err)
                    resolve(token) 
                })
        })
        return p
    }

    const responds = (data) => {
        res.json({
            token: data
        })
    }

    const errCatch = (err) => {
        res.status(403).json({
            message: err.message
        })
    }

    makeToken()
    .then(responds)
    .catch(errCatch)
    

}
