const { error, serverError } = require('../utils/response');

// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return error(res, '数据验证失败', 400, errors);
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return error(res, `${field} "${value}" 已存在`, 400);
  }

  // Mongoose CastError (无效的ObjectId)
  if (err.name === 'CastError') {
    return error(res, '无效的资源ID', 400);
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return error(res, '无效的访问令牌', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, '访问令牌已过期', 401);
  }

  // 文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return error(res, '文件大小超出限制', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return error(res, '不支持的文件类型', 400);
  }

  // 自定义错误
  if (err.statusCode) {
    return error(res, err.message, err.statusCode);
  }

  // 默认服务器错误
  return serverError(res, process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误');
};

// 404 错误处理
const notFoundHandler = (req, res) => {
  return error(res, `路由 ${req.originalUrl} 不存在`, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler
};