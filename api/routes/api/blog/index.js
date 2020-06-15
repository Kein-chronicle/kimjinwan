const router = require('express').Router()
const controller = require('./blog.controller')
const authMiddleware = require('../../../middlewares/auth')
var multer = require('multer')
const path = require("path");
let storage = multer.diskStorage({
    destination: function(req, file ,callback){
        callback(null, "upload/")
    },
    filename: function(req, file, callback){
        let extension = path.extname(file.originalname);
        let basename = path.basename(file.originalname, extension);
        callback(null, basename + "-" + Date.now() + extension);
    }
})
let upload = multer({storage: storage})

router.use('/write', authMiddleware)
router.post('/write', upload.single('file'), controller.write)

router.use('/delete', authMiddleware)
router.post('/delete', controller.delete)

router.use('/update', authMiddleware)
router.post('/update', controller.update)

router.get('/list', controller.list)

module.exports = router