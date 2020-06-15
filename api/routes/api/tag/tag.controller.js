const Tag = require('../../../models/tag')

exports.list = (req, res) => {


    const responds = (data) => {
        res.json({
            data,
            message: "tag list call success"
        })
    }

    const catchError = (err) => {
        res.status(403).json({
            message: err.message
        })
    }

    Tag.findAll()
    .then(responds)
    .catch(catchError)

}