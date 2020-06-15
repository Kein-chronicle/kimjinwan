const router = require('express').Router()
const auth = require('./auth')
const blog = require('./blog')
const tag = require('./tag')

// 가입, 로그인
router.use('/auth', auth)

// 블로그 관련
router.use('/blog', blog)

// tag 관련
router.use('/tag', tag)

module.exports = router