// mongoose
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Tag = new Schema({
    _at : { type: Date, default: new Date() },
    tag : {type: String, require: false}
})

Tag.statics.findAll = function() {
    return this.find({}).sort({tag: 1})
}

Tag.statics.checkTag = async function (tags) {
    if (!tags) {
        return true
    }
    for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];

        const checker = await this.find({tag: tag})
        if (checker.length === 0) {
            const newTag = new this({tag:tag})
            newTag.save()
        }
        
    }
    
    return true
}

module.exports = mongoose.model('Tag', Tag)