"""
Vercel Serverless Function for Flask App
将 Flask 应用适配为 Vercel Serverless Function
"""
import sys
import os
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 全局错误处理
def log_error(context, error):
    """统一的错误日志记录"""
    import traceback
    error_info = f"""
=== {context} ===
错误: {error}
类型: {type(error).__name__}
Traceback:
{traceback.format_exc()}
"""
    print(error_info)
    return error_info

# 延迟导入 Flask 应用，带完整的错误处理
app = None
_initialization_error = None

try:
    # 步骤 1: 测试基础模块
    print("步骤 1: 测试基础模块...")
    try:
        import requests
        print("✅ requests 模块已导入")
    except ImportError as e:
        log_error("requests 模块导入失败", e)
        raise
    
    # 步骤 2: 导入 Flask 应用
    print("步骤 2: 导入 Flask 应用...")
    try:
        from app import app as flask_app
        app = flask_app
        print("✅ Flask 应用导入成功")
    except Exception as e:
        _initialization_error = log_error("Flask 应用导入失败", e)
        raise
    
    # 步骤 3: 测试数据库连接（非阻塞）
    print("步骤 3: 测试数据库连接...")
    try:
        import db
        conn = db.get_connection()
        conn.close()
        print("✅ 数据库连接测试成功")
    except Exception as e:
        print(f"⚠️ 数据库连接测试失败（可能环境变量未设置）: {e}")
        # 不抛出异常，允许应用继续运行

except Exception as e:
    _initialization_error = log_error("应用初始化失败", e)
    # 创建一个简单的错误处理 Flask 应用
    from flask import Flask, jsonify
    app = Flask(__name__)
    
    @app.route("/<path:path>")
    def error_handler(path):
        return jsonify({
            "error": "Application initialization failed",
            "message": str(e),
            "trace": _initialization_error
        }), 500

# 确保 app 不为 None
if app is None:
    from flask import Flask, jsonify
    app = Flask(__name__)
    
    @app.route("/<path:path>")
    def error_handler(path):
        return jsonify({
            "error": "Application initialization failed",
            "message": "Flask app was not initialized properly",
            "trace": _initialization_error or "Unknown error"
        }), 500

# Vercel Serverless Function handler
# Vercel Python runtime 3.11 会自动检测 Flask WSGI 应用
# 直接导出 app 即可，Vercel 会自动处理
