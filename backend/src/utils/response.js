// 成功响应
const success = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// 错误响应
const error = (res, message = '操作失败', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

// 分页响应
const paginated = (res, data, pagination, message = '获取成功') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit)
    },
    timestamp: new Date().toISOString()
  });
};

// 未授权响应
const unauthorized = (res, message = '未授权访问') => {
  return res.status(401).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

// 禁止访问响应
const forbidden = (res, message = '禁止访问') => {
  return res.status(403).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

// 未找到响应
const notFound = (res, message = '资源未找到') => {
  return res.status(404).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

// 服务器错误响应
const serverError = (res, message = '服务器内部错误') => {
  return res.status(500).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  success,
  error,
  paginated,
  unauthorized,
  forbidden,
  notFound,
  serverError
};