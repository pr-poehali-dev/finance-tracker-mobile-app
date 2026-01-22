import json
import os
from datetime import datetime
import jwt
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для управления фиксированными расходами и планированием'''
    
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters') or {}
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    auth_header = headers.get('x-authorization') or headers.get('X-Authorization') or headers.get('authorization') or headers.get('Authorization')
    if not auth_header:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Authorization required'}),
            'isBase64Encoded': False
        }
    
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid token'}),
            'isBase64Encoded': False
        }
    
    resource_type = query_params.get('type')
    
    if method == 'GET' and resource_type:
        if 'id' in query_params:
            return get_deposits(user_id, query_params['id'])
        return get_items(user_id, resource_type)
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        return add_item(user_id, body)
    
    if method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        return update_item(user_id, body)
    
    if method == 'DELETE' and 'id' in query_params:
        return delete_item(user_id, query_params)
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid request'}),
        'isBase64Encoded': False
    }

def verify_token(token: str):
    '''Проверяет JWT токен и возвращает user_id'''
    jwt_secret = os.environ.get('JWT_SECRET')
    
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

def get_items(user_id: int, resource_type: str) -> dict:
    '''Получает список фиксированных расходов или планов'''
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    if resource_type == 'fixed':
        cur.execute(f'''
            SELECT id, title, amount, category, day_of_month, is_active, created_at
            FROM {schema}.fixed_expenses
            WHERE user_id = %s
            ORDER BY day_of_month ASC
        ''', (user_id,))
        
        rows = cur.fetchall()
        items = []
        for row in rows:
            items.append({
                'id': row[0],
                'title': row[1],
                'amount': float(row[2]),
                'category': row[3],
                'dayOfMonth': row[4],
                'isActive': row[5],
                'createdAt': row[6].isoformat() if row[6] else None
            })
    
    elif resource_type == 'planning':
        cur.execute(f'''
            SELECT id, title, target_amount, saved_amount, target_date, category, is_completed, created_at
            FROM {schema}.planning
            WHERE user_id = %s
            ORDER BY is_completed ASC, target_date ASC
        ''', (user_id,))
        
        rows = cur.fetchall()
        items = []
        for row in rows:
            items.append({
                'id': row[0],
                'title': row[1],
                'targetAmount': float(row[2]),
                'savedAmount': float(row[3]),
                'targetDate': row[4].isoformat() if row[4] else None,
                'category': row[5],
                'isCompleted': row[6],
                'createdAt': row[7].isoformat() if row[7] else None
            })
    else:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid type'}),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'items': items}),
        'isBase64Encoded': False
    }

def add_item(user_id: int, body: dict) -> dict:
    '''Добавляет фиксированный расход или план'''
    
    resource_type = body.get('type')
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    if resource_type == 'fixed':
        title = body.get('title')
        amount = body.get('amount')
        category = body.get('category')
        day_of_month = body.get('dayOfMonth')
        
        if not all([title, amount, category, day_of_month]):
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        cur.execute(f'''
            INSERT INTO {schema}.fixed_expenses (user_id, title, amount, category, day_of_month)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, title, amount, category, day_of_month, is_active, created_at
        ''', (user_id, title, amount, category, day_of_month))
        
        row = cur.fetchone()
        result = {
            'id': row[0],
            'title': row[1],
            'amount': float(row[2]),
            'category': row[3],
            'dayOfMonth': row[4],
            'isActive': row[5],
            'createdAt': row[6].isoformat() if row[6] else None
        }
    
    elif resource_type == 'planning':
        title = body.get('title')
        target_amount = body.get('targetAmount')
        category = body.get('category')
        target_date = body.get('targetDate')
        
        if not all([title, target_amount, category]):
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        cur.execute(f'''
            INSERT INTO {schema}.planning (user_id, title, target_amount, category, target_date)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, title, target_amount, saved_amount, target_date, category, is_completed, created_at
        ''', (user_id, title, target_amount, category, target_date))
        
        row = cur.fetchone()
        result = {
            'id': row[0],
            'title': row[1],
            'targetAmount': float(row[2]),
            'savedAmount': float(row[3]),
            'targetDate': row[4].isoformat() if row[4] else None,
            'category': row[5],
            'isCompleted': row[6],
            'createdAt': row[7].isoformat() if row[7] else None
        }
    else:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid type'}),
            'isBase64Encoded': False
        }
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'item': result}),
        'isBase64Encoded': False
    }

def update_item(user_id: int, body: dict) -> dict:
    '''Обновляет фиксированный расход или план'''
    
    resource_type = body.get('type')
    item_id = body.get('id')
    
    if not item_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing item id'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    if resource_type == 'fixed':
        is_active = body.get('isActive')
        
        cur.execute(f'''
            UPDATE {schema}.fixed_expenses
            SET is_active = %s
            WHERE id = %s AND user_id = %s
            RETURNING id, title, amount, category, day_of_month, is_active, created_at
        ''', (is_active, item_id, user_id))
        
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Item not found'}),
                'isBase64Encoded': False
            }
        
        result = {
            'id': row[0],
            'title': row[1],
            'amount': float(row[2]),
            'category': row[3],
            'dayOfMonth': row[4],
            'isActive': row[5],
            'createdAt': row[6].isoformat() if row[6] else None
        }
    
    elif resource_type == 'planning':
        if 'addAmount' in body:
            amount_to_add = body['addAmount']
            comment = body.get('comment', '')
            
            cur.execute(f'''
                INSERT INTO {schema}.planning_deposits (planning_id, amount, comment)
                VALUES (%s, %s, %s)
            ''', (item_id, amount_to_add, comment))
            
            cur.execute(f'''
                UPDATE {schema}.planning
                SET saved_amount = saved_amount + %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND user_id = %s
                RETURNING id, title, target_amount, saved_amount, target_date, category, is_completed, created_at
            ''', (amount_to_add, item_id, user_id))
        elif 'isCompleted' in body:
            cur.execute(f'''
                UPDATE {schema}.planning
                SET is_completed = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND user_id = %s
                RETURNING id, title, target_amount, saved_amount, target_date, category, is_completed, created_at
            ''', (body['isCompleted'], item_id, user_id))
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No fields to update'}),
                'isBase64Encoded': False
            }
        
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Item not found'}),
                'isBase64Encoded': False
            }
        
        result = {
            'id': row[0],
            'title': row[1],
            'targetAmount': float(row[2]),
            'savedAmount': float(row[3]),
            'targetDate': row[4].isoformat() if row[4] else None,
            'category': row[5],
            'isCompleted': row[6],
            'createdAt': row[7].isoformat() if row[7] else None
        }
    else:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid type'}),
            'isBase64Encoded': False
        }
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'item': result}),
        'isBase64Encoded': False
    }

def get_deposits(user_id: int, planning_id: str) -> dict:
    '''Получает историю пополнений для цели'''
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    cur.execute(f'''
        SELECT pd.id, pd.amount, pd.comment, pd.created_at
        FROM {schema}.planning_deposits pd
        JOIN {schema}.planning p ON pd.planning_id = p.id
        WHERE p.user_id = %s AND pd.planning_id = %s
        ORDER BY pd.created_at DESC
    ''', (user_id, planning_id))
    
    rows = cur.fetchall()
    deposits = []
    for row in rows:
        deposits.append({
            'id': row[0],
            'amount': float(row[1]),
            'comment': row[2] or '',
            'createdAt': row[3].isoformat() if row[3] else None
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'deposits': deposits}),
        'isBase64Encoded': False
    }

def delete_item(user_id: int, query_params: dict) -> dict:
    '''Удаляет фиксированный расход или план'''
    
    item_id = query_params.get('id')
    resource_type = query_params.get('type')
    
    if not item_id or not resource_type:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing id or type'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    table = 'fixed_expenses' if resource_type == 'fixed' else 'planning'
    
    cur.execute(f'''
        DELETE FROM {schema}.{table}
        WHERE id = %s AND user_id = %s
    ''', (item_id, user_id))
    
    conn.commit()
    deleted = cur.rowcount > 0
    cur.close()
    conn.close()
    
    if deleted:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    else:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Item not found'}),
            'isBase64Encoded': False
        }