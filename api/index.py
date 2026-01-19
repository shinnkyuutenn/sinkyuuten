"""
Vercel Serverless Function wrapper for Flask app
Vercel Python runtime 使用 WSGI 应用
"""
import sys
import os

# 添加项目根目录到 Python 路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# 导入 Flask 应用
from app import app

# Vercel Python runtime 期望导出 app 对象（WSGI 应用）
# 或者使用 handler 函数
def handler(request):
    """
    Vercel serverless function handler
    """
    from werkzeug.wrappers import Request
    
    # 构建 WSGI 环境字典
    environ = {
        'REQUEST_METHOD': request.method,
        'SCRIPT_NAME': '',
        'PATH_INFO': request.path,
        'QUERY_STRING': request.query_string.decode('utf-8') if request.query_string else '',
        'CONTENT_TYPE': request.headers.get('Content-Type', ''),
        'CONTENT_LENGTH': str(len(request.body)) if request.body else '',
        'SERVER_NAME': request.headers.get('Host', 'localhost'),
        'SERVER_PORT': '443',
        'SERVER_PROTOCOL': 'HTTP/1.1',
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': 'https',
        'wsgi.input': request.body if request.body else b'',
        'wsgi.errors': sys.stderr,
        'wsgi.multithread': False,
        'wsgi.multiprocess': False,
        'wsgi.run_once': False,
    }
    
    # 添加 HTTP 头到环境变量
    for key, value in request.headers.items():
        key = key.upper().replace('-', '_')
        if key not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            environ[f'HTTP_{key}'] = value
    
    # 使用 Flask 应用处理请求
    with app.request_context(environ):
        response = app.full_dispatch_request()
    
    # 返回 Vercel 格式的响应
    return {
        'statusCode': response.status_code,
        'headers': dict(response.headers),
        'body': response.get_data(as_text=True)
    }

# Vercel 也支持直接导出 WSGI 应用
# 如果 handler 函数不工作，可以尝试直接导出 app
# export app

