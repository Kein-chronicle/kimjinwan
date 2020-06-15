const rootUrl = 'https://api.kimjinwan.com/api'
const authApi = rootUrl + "/auth"
const blogApi = rootUrl + "/blog"
const tagApi = rootUrl + "/tag"

const api = {
    login: {
        url: authApi+'/login',
        method: 'POST'
    },
    write: {
        url: blogApi + "/write",
        method: 'POST'
    },
    delete: {
        url: blogApi + "/delete",
        method: 'POST'
    },
    update: {
        url: blogApi + "/update",
        method: 'POST'
    },
    list: {
        url: blogApi + "/list",
        method: 'GET'
    },
    tags: {
        url: tagApi + "/list",
        method: 'GET'
    }

}


export default api