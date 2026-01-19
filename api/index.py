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

# Vercel Python runtime 直接支持 WSGI 应用
# 直接导出 app 对象即可

