import json
import os
from datetime import datetime, date
import jwt
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для автоматического создания расходов из фиксированных платежей'''
    
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters') or {}
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        return process_auto_expenses(user_id, body)
    
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

def process_auto_expenses(user_id: int, body: dict) -> dict:
    '''Создает расходы из активных фиксированных платежей для указанного месяца'''
    
    year = body.get('year')
    month = body.get('month')
    
    if not year or not month:
        current_date = datetime.now()
        year = current_date.year
        month = current_date.month
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    # Получаем активные фиксированные расходы пользователя
    cur.execute(f'''
        SELECT id, title, amount, category, day_of_month
        FROM {schema}.fixed_expenses
        WHERE user_id = %s AND is_active = TRUE
    ''', (user_id,))
    
    fixed_expenses = cur.fetchall()
    created_expenses = []
    skipped_expenses = []
    
    for fixed_exp in fixed_expenses:
        fixed_id, title, amount, category, day_of_month = fixed_exp
        
        # Проверяем, не создан ли уже расход для этого месяца
        cur.execute(f'''
            SELECT id FROM {schema}.auto_created_expenses
            WHERE fixed_expense_id = %s AND year = %s AND month = %s
        ''', (fixed_id, year, month))
        
        if cur.fetchone():
            skipped_expenses.append({
                'fixedExpenseId': fixed_id,
                'title': title,
                'reason': 'Already created for this month'
            })
            continue
        
        # Определяем дату расхода
        # Если день месяца уже прошел в текущем месяце, используем этот день
        # Иначе используем текущую дату
        current_day = datetime.now().day
        expense_day = day_of_month if day_of_month <= current_day else current_day
        
        try:
            expense_date = date(year, month, expense_day)
        except ValueError:
            # Если день невалидный для месяца (например, 31 февраля), используем последний день месяца
            if month == 12:
                next_month = date(year + 1, 1, 1)
            else:
                next_month = date(year, month + 1, 1)
            
            from datetime import timedelta
            last_day = (next_month - timedelta(days=1)).day
            expense_date = date(year, month, min(day_of_month, last_day))
        
        # Создаем расход
        cur.execute(f'''
            INSERT INTO {schema}.expenses (user_id, amount, category, description, date)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, amount, category, description, date
        ''', (user_id, amount, category, f'{title} (автоплатеж)', expense_date))
        
        expense = cur.fetchone()
        expense_id = expense[0]
        
        # Записываем в таблицу автосозданных расходов
        cur.execute(f'''
            INSERT INTO {schema}.auto_created_expenses (user_id, fixed_expense_id, expense_id, year, month)
            VALUES (%s, %s, %s, %s, %s)
        ''', (user_id, fixed_id, expense_id, year, month))
        
        created_expenses.append({
            'id': expense[0],
            'amount': float(expense[1]),
            'category': expense[2],
            'description': expense[3],
            'date': expense[4].isoformat(),
            'fixedExpenseId': fixed_id,
            'fixedExpenseTitle': title
        })
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'created': created_expenses,
            'skipped': skipped_expenses,
            'total': len(created_expenses),
            'year': year,
            'month': month
        }),
        'isBase64Encoded': False
    }
