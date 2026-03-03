import json
import os
# redeploy v5

import psycopg2
import jwt
from urllib.request import urlopen, Request
from urllib.error import URLError


def handler(event: dict, context) -> dict:
    """API для управления кредитами и AI-анализа кредитной нагрузки"""

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

    action = query_params.get('action', '')

    if method == 'GET' and action == 'ai':
        return ai_analyze(user_id, '')

    if method == 'GET':
        return get_credits(user_id)

    if method == 'POST' and action == 'ai':
        body = json.loads(event.get('body', '{}'))
        return ai_analyze(user_id, body.get('question', ''))

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        return add_credit(user_id, body)

    if method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        return update_credit(user_id, body)

    if method == 'DELETE':
        return delete_credit(user_id, query_params.get('id'))

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


def db_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def get_credits(user_id: int) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''
        SELECT id, title, total_debt, interest_rate, monthly_payment, payment_day, created_at
        FROM {db_schema()}.credits
        WHERE user_id = %s
        ORDER BY payment_day ASC
    ''', (user_id,))
    rows = cur.fetchall()
    conn.close()

    credits = [{
        'id': r[0], 'title': r[1], 'totalDebt': float(r[2]),
        'interestRate': float(r[3]), 'monthlyPayment': float(r[4]),
        'paymentDay': r[5], 'createdAt': r[6].isoformat() if r[6] else None
    } for r in rows]

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
        INSERT INTO {db_schema()}.credits (user_id, title, total_debt, interest_rate, monthly_payment, payment_day)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, title, total_debt, interest_rate, monthly_payment, payment_day, created_at
    ''', (user_id, body['title'], body['totalDebt'], body['interestRate'], body['monthlyPayment'], body['paymentDay']))
    r = cur.fetchone()
    conn.commit()
    conn.close()

    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'credit': {
            'id': r[0], 'title': r[1], 'totalDebt': float(r[2]),
            'interestRate': float(r[3]), 'monthlyPayment': float(r[4]),
            'paymentDay': r[5], 'createdAt': r[6].isoformat() if r[6] else None
        }}),
        'isBase64Encoded': False
    }


def update_credit(user_id: int, body: dict) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''
        UPDATE {db_schema()}.credits
        SET title=%s, total_debt=%s, interest_rate=%s, monthly_payment=%s, payment_day=%s, updated_at=NOW()
        WHERE id=%s AND user_id=%s
    ''', (body['title'], body['totalDebt'], body['interestRate'], body['monthlyPayment'], body['paymentDay'], body['id'], user_id))
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
        DELETE FROM {db_schema()}.credits WHERE id=%s AND user_id=%s
    ''', (int(credit_id), user_id))
    conn.commit()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }


def ai_analyze(user_id: int, question: str) -> dict:
    if not os.environ.get('CLOUDE_API'):
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Anthropic API key not configured'}),
            'isBase64Encoded': False
        }

    data = get_financial_data(user_id)
    answer = ask_claude(data, question)

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'answer': answer}),
        'isBase64Encoded': False
    }


def get_financial_data(user_id: int) -> dict:
    from datetime import date
    conn = get_conn()
    cur = conn.cursor()
    schema = db_schema()
    today = date.today()

    cur.execute(f'''
        SELECT title, total_debt, interest_rate, monthly_payment, payment_day
        FROM {schema}.credits WHERE user_id=%s ORDER BY interest_rate DESC
    ''', (user_id,))
    credits = [{'title': r[0], 'total_debt': float(r[1]), 'interest_rate': float(r[2]),
                'monthly_payment': float(r[3]), 'payment_day': r[4]} for r in cur.fetchall()]

    cur.execute(f'SELECT amount FROM {schema}.incomes WHERE user_id=%s', (user_id,))
    total_income = sum(float(r[0]) for r in cur.fetchall())

    cur.execute(f'SELECT amount FROM {schema}.fixed_expenses WHERE user_id=%s', (user_id,))
    total_fixed = sum(float(r[0]) for r in cur.fetchall())

    cur.execute(f'''
        SELECT amount FROM {schema}.expenses
        WHERE user_id=%s AND EXTRACT(MONTH FROM date)=%s AND EXTRACT(YEAR FROM date)=%s
    ''', (user_id, today.month, today.year))
    total_variable = sum(float(r[0]) for r in cur.fetchall())

    conn.close()

    monthly_credit_payments = sum(c['monthly_payment'] for c in credits)
    free_cash = total_income - total_fixed - total_variable - monthly_credit_payments

    return {
        'credits': credits,
        'total_income': total_income,
        'total_fixed_expenses': total_fixed,
        'total_variable_expenses': total_variable,
        'monthly_credit_payments': monthly_credit_payments,
        'free_cash': free_cash,
        'current_month': today.strftime('%B %Y'),
        'today_day': today.day
    }


def build_prompt(data: dict, question: str) -> tuple:
    credits_text = ''
    if data['credits']:
        for c in data['credits']:
            credits_text += (
                f"- {c['title']}: долг {c['total_debt']:,.0f} руб., "
                f"ставка {c['interest_rate']}% годовых, "
                f"платёж {c['monthly_payment']:,.0f} руб. каждый {c['payment_day']}-й день\n"
            )
    else:
        credits_text = 'Кредиты не добавлены.\n'

    system_prompt = (
        f"Ты финансовый советник. Анализируй данные пользователя и давай конкретные рекомендации по управлению кредитами.\n\n"
        f"ФИНАНСОВАЯ СИТУАЦИЯ (месяц: {data['current_month']}, сегодня {data['today_day']}-е число):\n"
        f"Доходы: {data['total_income']:,.0f} руб./мес\n"
        f"Фиксированные расходы: {data['total_fixed_expenses']:,.0f} руб./мес\n"
        f"Переменные расходы в этом месяце: {data['total_variable_expenses']:,.0f} руб.\n"
        f"Платежи по кредитам: {data['monthly_credit_payments']:,.0f} руб./мес\n"
        f"Свободные деньги: {data['free_cash']:,.0f} руб.\n\n"
        f"КРЕДИТЫ (по убыванию ставки):\n{credits_text}\n"
        f"ПРАВИЛА:\n"
        f"1. Давай конкретные суммы и даты\n"
        f"2. Используй стратегию 'лавина' (сначала высокая ставка) или 'снежный ком' (сначала маленький долг) — объясни выбор\n"
        f"3. Укажи конкретный день для досрочного платежа\n"
        f"4. Рассчитай срок погашения при текущем темпе и при досрочном\n"
        f"5. Отвечай на русском, кратко и по делу"
    )
    user_msg = question if question else "Проанализируй мою кредитную нагрузку и дай рекомендации по досрочному погашению."
    return system_prompt, user_msg


def ask_claude(data: dict, question: str) -> str:
    api_key = os.environ.get('CLOUDE_API')
    print(f'CLOUDE_API present: {bool(api_key)}, starts: {api_key[:15] if api_key else "EMPTY"}')
    system_prompt, user_msg = build_prompt(data, question)

    payload = json.dumps({
        'model': 'claude-3-haiku-20240307',
        'max_tokens': 1024,
        'system': system_prompt,
        'messages': [
            {'role': 'user', 'content': user_msg}
        ]
    }).encode('utf-8')

    req = Request(
        'https://api.anthropic.com/v1/messages',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01',
        }
    )

    with urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read().decode('utf-8'))
        return result['content'][0]['text']