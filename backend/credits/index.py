import json
import os
import psycopg2
import jwt


def handler(event: dict, context) -> dict:
    """API для управления кредитами пользователя"""

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

    auth_header = (
        headers.get('x-authorization') or
        headers.get('X-Authorization') or
        headers.get('authorization') or
        headers.get('Authorization')
    )
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

    if method == 'GET':
        return get_credits(user_id)

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        return add_credit(user_id, body)

    if method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        return update_credit(user_id, body)

    if method == 'DELETE':
        credit_id = query_params.get('id')
        return delete_credit(user_id, credit_id)

    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid request'}),
        'isBase64Encoded': False
    }


def verify_token(token: str):
    jwt_secret = os.environ.get('JWT_SECRET')
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None


def get_conn():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))


def schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def get_credits(user_id: int) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''
        SELECT id, title, total_debt, interest_rate, monthly_payment, payment_day, created_at
        FROM {schema()}.credits
        WHERE user_id = %s
        ORDER BY payment_day ASC
    ''', (user_id,))
    rows = cur.fetchall()
    conn.close()

    credits = []
    for row in rows:
        credits.append({
            'id': row[0],
            'title': row[1],
            'totalDebt': float(row[2]),
            'interestRate': float(row[3]),
            'monthlyPayment': float(row[4]),
            'paymentDay': row[5],
            'createdAt': row[6].isoformat() if row[6] else None
        })

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'credits': credits}),
        'isBase64Encoded': False
    }


def add_credit(user_id: int, body: dict) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''
        INSERT INTO {schema()}.credits (user_id, title, total_debt, interest_rate, monthly_payment, payment_day)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, title, total_debt, interest_rate, monthly_payment, payment_day, created_at
    ''', (
        user_id,
        body['title'],
        body['totalDebt'],
        body['interestRate'],
        body['monthlyPayment'],
        body['paymentDay']
    ))
    row = cur.fetchone()
    conn.commit()
    conn.close()

    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'credit': {
                'id': row[0],
                'title': row[1],
                'totalDebt': float(row[2]),
                'interestRate': float(row[3]),
                'monthlyPayment': float(row[4]),
                'paymentDay': row[5],
                'createdAt': row[6].isoformat() if row[6] else None
            }
        }),
        'isBase64Encoded': False
    }


def update_credit(user_id: int, body: dict) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''
        UPDATE {schema()}.credits
        SET title = %s, total_debt = %s, interest_rate = %s, monthly_payment = %s, payment_day = %s, updated_at = NOW()
        WHERE id = %s AND user_id = %s
        RETURNING id
    ''', (
        body['title'],
        body['totalDebt'],
        body['interestRate'],
        body['monthlyPayment'],
        body['paymentDay'],
        body['id'],
        user_id
    ))
    conn.commit()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }


def delete_credit(user_id: int, credit_id: str) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''
        DELETE FROM {schema()}.credits
        WHERE id = %s AND user_id = %s
    ''', (int(credit_id), user_id))
    conn.commit()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }
