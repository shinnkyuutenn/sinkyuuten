"""
Vercel Serverless Function for Flask App
将 Flask 应用适配为 Vercel Serverless Function
"""
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 导入 Flask 应用
from app import app

# Vercel 会自动识别 Flask 应用
# 如果需要自定义 handler，可以使用以下代码：
# from vercel import Vercel
# vercel = Vercel()
# handler = vercel(app)

