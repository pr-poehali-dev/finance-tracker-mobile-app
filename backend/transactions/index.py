import json
import os
from datetime import datetime
import jwt
import psycopg2
from decimal import Decimal

def handler(event: dict, context) -> dict:
    '''API для управления доходами и расходами пользователей'''
    
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters') or {}
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    auth_header = headers.get('authorization') or headers.get('Authorization')
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
    
    if method == 'GET' and 'type' in query_params:
        return get_transactions(user_id, query_params)
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        return add_transaction(user_id, body)
    
    if method == 'DELETE' and 'id' in query_params:
        return delete_transaction(user_id, query_params)
    
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

def get_transactions(user_id: int, query_params: dict) -> dict:
    '''Получает транзакции пользователя'''
    transaction_type = query_params.get('type')
    year = query_params.get('year')
    month = query_params.get('month')
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    if transaction_type == 'income':
        table = 'incomes'
        select_columns = 'id, amount, description, date'
    else:
        table = 'expenses'
        select_columns = 'id, amount, category, description, date'
    
    where_conditions = [f'user_id = {user_id}']
    
    if year and month:
        where_conditions.append(f"EXTRACT(YEAR FROM date) = {year}")
        where_conditions.append(f"EXTRACT(MONTH FROM date) = {month}")
    
    where_clause = ' AND '.join(where_conditions)
    
    query = f'''
        SELECT {select_columns}
        FROM {schema}.{table}
        WHERE {where_clause}
        ORDER BY date DESC
    '''
    
    cur.execute(query)
    rows = cur.fetchall()
    
    transactions = []
    for row in rows:
        if transaction_type == 'income':
            transactions.append({
                'id': row[0],
                'amount': float(row[1]),
                'description': row[2],
                'date': row[3].isoformat()
            })
        else:
            transactions.append({
                'id': row[0],
                'amount': float(row[1]),
                'category': row[2],
                'description': row[3],
                'date': row[4].isoformat()
            })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'transactions': transactions}),
        'isBase64Encoded': False
    }

def add_transaction(user_id: int, body: dict) -> dict:
    '''Добавляет новую транзакцию'''
    transaction_type = body.get('type')
    amount = body.get('amount')
    description = body.get('description', '')
    date = body.get('date', datetime.now().date().isoformat())
    
    if not transaction_type or not amount:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing required fields'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    if transaction_type == 'income':
        cur.execute(f'''
            INSERT INTO {schema}.incomes (user_id, amount, description, date)
            VALUES (%s, %s, %s, %s)
            RETURNING id, amount, description, date
        ''', (user_id, amount, description, date))
        
        row = cur.fetchone()
        result = {
            'id': row[0],
            'amount': float(row[1]),
            'description': row[2],
            'date': row[3].isoformat()
        }
    else:
        category = body.get('category', 'other')
        cur.execute(f'''
            INSERT INTO {schema}.expenses (user_id, amount, category, description, date)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, amount, category, description, date
        ''', (user_id, amount, category, description, date))
        
        row = cur.fetchone()
        result = {
            'id': row[0],
            'amount': float(row[1]),
            'category': row[2],
            'description': row[3],
            'date': row[4].isoformat()
        }
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'transaction': result}),
        'isBase64Encoded': False
    }

def delete_transaction(user_id: int, query_params: dict) -> dict:
    '''Удаляет транзакцию'''
    transaction_id = query_params.get('id')
    transaction_type = query_params.get('type')
    
    if not transaction_id or not transaction_type:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing transaction id or type'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    table = 'incomes' if transaction_type == 'income' else 'expenses'
    
    cur.execute(f'''
        DELETE FROM {schema}.{table}
        WHERE id = %s AND user_id = %s
    ''', (transaction_id, user_id))
    
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
            'body': json.dumps({'error': 'Transaction not found'}),
            'isBase64Encoded': False
        }
