const sendResponse = (res, statusCode, message, data = {}, pagination = null) => {
    const responseBody = {
        status: 'success',
        message,
        data,
    };
    if (pagination) {
        responseBody.pagination = pagination;
    }
    res.status(statusCode).json({
        ...responseBody,
    });
};
export default sendResponse;
