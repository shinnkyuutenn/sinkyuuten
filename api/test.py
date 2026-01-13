"""
最简单的测试端点 - 用于验证 Vercel Python runtime 是否正常工作
"""
def handler(request):
    """最简单的 handler，不依赖任何外部模块"""
    try:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': '{"status": "ok", "message": "Python runtime is working"}'
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': f'{{"status": "error", "message": "{str(e)}"}}'
        }

