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
try:
    from app import app
except Exception as e:
    # エラーハンドリング: インポートエラーをログに記録
    import traceback
    print(f"Flask アプリのインポートエラー: {e}")
    print(traceback.format_exc())
    raise

# Vercel Serverless Function handler
# Vercel の Python runtime は Flask WSGI アプリを自動的に serverless function に変換する
# app を直接エクスポートすれば、Vercel が WSGI 変換を処理する
