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

# 导入 Flask 应用
from app import app

# Vercel 的 @vercel/python 会自动识别 Flask WSGI 应用
# 直接导出 app 即可

