#!/usr/bin/env python3
"""
Neon 数据库初始化脚本
用于在 Neon 数据库上执行 Schema 和初始化数据
"""
import os
import sys
from pathlib import Path
from db import get_connection
import psycopg2

def init_database():
    """初始化 Neon 数据库"""
    print("=" * 60)
    print("Neon 数据库初始化脚本")
    print("=" * 60)
    
    # 检查环境变量
    database_url = os.getenv('NEON_DATABASE_URL') or os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ 错误: 未找到 NEON_DATABASE_URL 或 DATABASE_URL 环境变量")
        print("\n请设置环境变量:")
        print("  export NEON_DATABASE_URL='你的连接字符串'")
        sys.exit(1)
    
    print(f"✅ 找到数据库连接字符串")
    print(f"   主机: {database_url.split('@')[1].split('/')[0] if '@' in database_url else 'N/A'}")
    
    try:
        # 测试连接
        print("\n📡 正在连接数据库...")
        conn = get_connection()
        cur = conn.cursor()
        print("✅ 数据库连接成功")
        
        # 检查表是否已存在
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('shops', 'keywords', 'users')
        """)
        existing_tables = [row[0] for row in cur.fetchall()]
        
        if existing_tables:
            print(f"\n⚠️  警告: 检测到已存在的表: {', '.join(existing_tables)}")
            response = input("是否继续初始化？这可能会创建重复的表。 (y/N): ")
            if response.lower() != 'y':
                print("❌ 初始化已取消")
                conn.close()
                sys.exit(0)
        
        # 读取并执行 Schema 文件
        schema_path = Path(__file__).parent / "src" / "india_reviews_schema.sql"
        if not schema_path.exists():
            print(f"❌ 错误: 找不到 Schema 文件: {schema_path}")
            conn.close()
            sys.exit(1)
        
        print(f"\n📄 正在读取 Schema 文件: {schema_path}")
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        # 分割 SQL 语句（按分号分割，但要注意函数定义中的分号）
        print("🔧 正在执行数据库 Schema...")
        
        # 使用 psycopg2 的 execute 方法，它会自动处理多个语句
        # 但为了更好的错误处理，我们逐条执行
        statements = []
        current_statement = []
        in_function = False
        
        for line in schema_sql.split('\n'):
            stripped = line.strip()
            # 跳过注释和空行
            if not stripped or stripped.startswith('--'):
                continue
            
            current_statement.append(line)
            
            # 检查是否是函数定义
            if 'CREATE FUNCTION' in stripped.upper() or 'CREATE OR REPLACE FUNCTION' in stripped.upper():
                in_function = True
            
            # 检查函数结束
            if in_function and '$$;' in stripped:
                in_function = False
                statements.append('\n'.join(current_statement))
                current_statement = []
            elif not in_function and stripped.endswith(';'):
                statements.append('\n'.join(current_statement))
                current_statement = []
        
        # 执行所有语句
        executed = 0
        for i, statement in enumerate(statements, 1):
            if not statement.strip():
                continue
            try:
                cur.execute(statement)
                executed += 1
                if i % 10 == 0:
                    print(f"   已执行 {i} 条语句...")
            except psycopg2.Error as e:
                # 某些错误可以忽略（如表已存在）
                error_msg = str(e).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    print(f"   ⚠️  语句 {i}: {e.pgerror[:50]}... (已跳过)")
                else:
                    print(f"   ❌ 语句 {i} 执行失败: {e.pgerror}")
                    print(f"   语句内容: {statement[:100]}...")
                    raise
        
        conn.commit()
        print(f"✅ Schema 执行完成 (共 {executed} 条语句)")
        
        # 验证表是否创建成功
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"\n📊 已创建的表: {', '.join(tables) if tables else '无'}")
        
        # 询问是否导入测试数据
        test_data_path = Path(__file__).parent / "src" / "test_restaurants_data.sql"
        if test_data_path.exists():
            print(f"\n📦 检测到测试数据文件: {test_data_path}")
            response = input("是否导入测试数据？ (y/N): ")
            if response.lower() == 'y':
                print("📄 正在导入测试数据...")
                with open(test_data_path, 'r', encoding='utf-8') as f:
                    test_data_sql = f.read()
                
                # 执行测试数据
                cur.execute(test_data_sql)
                conn.commit()
                print("✅ 测试数据导入完成")
        
        # 询问是否创建管理员账户
        print(f"\n👤 是否创建管理员账户？")
        response = input("(y/N): ")
        if response.lower() == 'y':
            from login import hash_password
            email = input("  邮箱: ").strip() or "admin@example.com"
            name = input("  用户名: ").strip() or "admin"
            password = input("  密码: ").strip() or "admin123"
            
            password_hash = hash_password(password)
            spicy_level = 3
            clean_level = 3
            comfortable_level = 3
            congestion_level = 3
            
            # 检查用户是否已存在
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing = cur.fetchone()
            
            if existing:
                print(f"   ⚠️  用户 '{email}' 已存在，更新密码...")
                cur.execute(
                    "UPDATE users SET password_hash = %s WHERE email = %s",
                    (password_hash, email)
                )
            else:
                cur.execute(
                    """
                    INSERT INTO users
                    (name, email, password_hash,
                     spicy_level, clean_level, comfortable_level, congestion_level)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (name, email, password_hash,
                     spicy_level, clean_level, comfortable_level, congestion_level)
                )
                user_id = cur.fetchone()[0]
                print(f"   ✅ 管理员账户创建成功 (ID: {user_id})")
            
            conn.commit()
        
        conn.close()
        print("\n" + "=" * 60)
        print("✅ 数据库初始化完成！")
        print("=" * 60)
        
    except psycopg2.Error as e:
        print(f"\n❌ 数据库错误: {e}")
        print(f"   错误详情: {e.pgerror}")
        if conn:
            conn.rollback()
            conn.close()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
            conn.close()
        sys.exit(1)

if __name__ == "__main__":
    init_database()




