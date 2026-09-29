export const errorHandler = (err, req, res, next) => {
    console.error('[Gateway Error]', err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal Server Error',
    });
};