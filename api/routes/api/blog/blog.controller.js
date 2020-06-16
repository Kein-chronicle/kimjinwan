const Blog = require('../../../models/blog')
const Tag = require('../../../models/tag')

// write
exports.write = (req, res) => {
    if (!req.decoded.admin) {
        return res.status(403).json({
            message: 'token error'
        })
    }

    const {description, tags} = req.body
    const file = req.file

    const obj = {
        _at: new Date(),
        description,
        tags,
        file
    }

    const responds = (data) => {
        res.json({
            data,
            message: "write success"
        })
    }

    const catchError = (err) => {
        res.status(403).json({
            message: err.message
        })
    }

    Blog.write(obj)
    .then(async ()=>{
        await Tag.checkTag(tags)
    })
    .then(responds)
    .catch(catchError)

}

// delete
exports.delete = (req, res) => {
    if (!req.decoded.admin) {
        return res.status(403).json({
            message: 'token error'
        })
    }

    const {_id} = req.body

    const responds = (data) => {
        res.json({
            data,
            message: "delete success"
        })
    }

    const catchError = (err) => {
        res.status(403).json({
            message: err.message
        })
    }


    Blog.removeOne(_id)
    .then(responds)
    .catch(catchError)

}

// update
exports.update = (req, res) => {
    if (!req.decoded.admin) {
        return res.status(403).json({
            message: 'token error'
        })
    }

    const {_id, description} = req.body

    const responds = (data) => {
        res.json({
            data,
            message: "update success"
        })
    }

    const catchError = (err) => {
        res.status(403).json({
            message: err.message
        })
    }

    Blog.updateDescription(_id, description)
    .then(responds)
    .catch(catchError)

}


// list
exports.list = (req, res) => {
    const responds = (data) => {
        res.json({
            data
        })
    }

    const catchError = (err) => {
        json.status(403).json({
            message: err.message
        })
    }

    Blog.findAll()
    .then(responds)
    .catch(catchError)
}

exports.read = (req, res) => {
    const {_id} = req.body
    
    const responds = (data) => {
        res.json({
            data
        })
    }

    const catchError = (err) => {
        json.status(403).json({
            message: err.message
        })
    }

    Blog.findOneById(_id)
    .then(responds)
    .catch(catchError)
}