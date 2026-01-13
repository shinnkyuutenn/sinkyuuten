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

# 添加错误处理包装器
def create_app():
    """创建 Flask 应用，带错误处理"""
    try:
        # 测试关键模块是否可用
        try:
            import requests
            print("✅ requests 模块已导入")
        except ImportError as e:
            print(f"❌ requests 模块导入失败: {e}")
            raise
        
        # 导入 Flask 应用
        from app import app
        print("✅ Flask 应用导入成功")
        
        # 测试数据库连接（可选，不阻塞启动）
        try:
            import db
            conn = db.get_connection()
            conn.close()
            print("✅ 数据库连接测试成功")
        except Exception as e:
            print(f"⚠️ 数据库连接测试失败（可能环境变量未设置）: {e}")
        
        return app
    except Exception as e:
        # 详细的错误信息
        import traceback
        error_msg = f"Flask アプリの初期化エラー: {e}\n{traceback.format_exc()}"
        print(error_msg)
        raise

# 创建应用实例
app = create_app()

# Vercel Serverless Function handler
# Vercel の Python runtime は Flask WSGI アプリを自動的に serverless function に変換する
