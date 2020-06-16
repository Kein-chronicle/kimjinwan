// mongoose
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Blog = new Schema({
    _at : { type: Date, default: new Date() },
    description : {type: String, require: false},
    file : {type: Object, required: false},
    tags: {type: Array, required: true},
    useYn: {type: Boolean, default: true}
})

Blog.statics.write = function (obj) {
    const result = new this(obj)
    return result.save()
}

Blog.statics.findAll = function() {
    return this.find({useYn: true}).sort({_at: -1})
}

Blog.statics.findOneById = function(_id) {
    return this.findOne({_id})
}

Blog.statics.removeOne = async function(_id) {
    return await this.updateOne({_id}, {useYn: false})
}

Blog.statics.updateDescription = async function(_id, description) {
    return await this.updateOne({_id}, {description})
}


module.exports = mongoose.model('Blog', Blog)