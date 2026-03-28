module.exports = (request, response, next) => {
    if (request.method === 'POST') {
        request.method = 'GET'
        request.query = request.body
    }

    // 处理IE8下的文件上传
    if ((request.headers['content-type'] || '').startsWith('multipart/form-data')) {
        response.header('content-type', 'text/html')
    }
    next()
}
