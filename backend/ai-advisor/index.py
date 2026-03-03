import json
import os
import psycopg2
import jwt
from urllib.request import urlopen, Request
from urllib.error import URLError


def handler(event: dict, context) -> dict:
    """AI-помощник для анализа кредитной нагрузки и рекомендаций по досрочному погашению"""

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    body = json.loads(event.get('body', '{}'))
    user_question = body.get('question', '')

    financial_data = get_financial_data(user_id)
    answer = ask_openai(financial_data, user_question)

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'answer': answer}),
        'isBase64Encoded': False
    }


def verify_token(token: str):
    jwt_secret = os.environ.get('JWT_SECRET')
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None


def get_financial_data(user_id: int) -> dict:
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    cur.execute(f'''
        SELECT title, total_debt, interest_rate, monthly_payment, payment_day
        FROM {schema}.credits
        WHERE user_id = %s
        ORDER BY interest_rate DESC
    ''', (user_id,))
    credits = []
    for row in cur.fetchall():
        credits.append({
            'title': row[0],
            'total_debt': float(row[1]),
            'interest_rate': float(row[2]),
            'monthly_payment': float(row[3]),
            'payment_day': row[4]
        })

    cur.execute(f'''
        SELECT amount FROM {schema}.incomes
        WHERE user_id = %s
    ''', (user_id,))
    total_income = sum(row[0] for row in cur.fetchall())

    cur.execute(f'''
        SELECT amount FROM {schema}.fixed_expenses
        WHERE user_id = %s
    ''', (user_id,))
    total_fixed = sum(row[0] for row in cur.fetchall())

    from datetime import date
    today = date.today()
    cur.execute(f'''
        SELECT amount FROM {schema}.expenses
        WHERE user_id = %s AND EXTRACT(MONTH FROM date) = %s AND EXTRACT(YEAR FROM date) = %s
    ''', (user_id, today.month, today.year))
    total_variable = sum(float(row[0]) for row in cur.fetchall())

    conn.close()

    monthly_credit_payments = sum(c['monthly_payment'] for c in credits)
    free_cash = float(total_income) - float(total_fixed) - total_variable - monthly_credit_payments

    return {
        'credits': credits,
        'total_income': float(total_income),
        'total_fixed_expenses': float(total_fixed),
        'total_variable_expenses': total_variable,
        'monthly_credit_payments': monthly_credit_payments,
        'free_cash': free_cash,
        'current_month': today.strftime('%B %Y'),
        'today_day': today.day
    }


def ask_openai(data: dict, question: str) -> str:
    openai_key = os.environ.get('OPENAI_API_KEY')

    credits_text = ''
    if data['credits']:
        for c in data['credits']:
            credits_text += (
                f"- {c['title']}: долг {c['total_debt']:,.0f} ₽, "
                f"ставка {c['interest_rate']}% годовых, "
                f"платёж {c['monthly_payment']:,.0f} ₽ каждый {c['payment_day']}-й день месяца\n"
            )
    else:
        credits_text = 'Кредиты не добавлены.\n'

    system_prompt = f"""Ты финансовый советник. Анализируй данные пользователя и давай конкретные рекомендации по управлению кредитами.

ФИНАНСОВАЯ СИТУАЦИЯ ПОЛЬЗОВАТЕЛЯ (текущий месяц: {data['current_month']}, сегодня {data['today_day']}-е число):

Доходы в месяц: {data['total_income']:,.0f} ₽
Фиксированные расходы: {data['total_fixed_expenses']:,.0f} ₽
Переменные расходы в этом месяце: {data['total_variable_expenses']:,.0f} ₽
Ежемесячные платежи по кредитам: {data['monthly_credit_payments']:,.0f} ₽
Свободные деньги после всех расходов: {data['free_cash']:,.0f} ₽

КРЕДИТЫ (отсортированы по убыванию ставки):
{credits_text}

ПРАВИЛА РЕКОМЕНДАЦИЙ:
1. Всегда давай конкретные суммы и даты
2. Используй стратегию "лавина" (гасить сначала с самой высокой ставкой) или "снежный ком" (сначала самый маленький долг) — объясни какую и почему
3. Укажи конкретный день месяца для досрочного платежа
4. Рассчитай сколько месяцев уйдёт на погашение при текущем темпе и при досрочном
5. Отвечай на русском языке, кратко и по делу"""

    user_msg = question if question else "Проанализируй мою кредитную нагрузку и дай рекомендации по досрочному погашению."

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_msg}
        ],
        'max_tokens': 1000,
        'temperature': 0.7
    }).encode('utf-8')

    req = Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {openai_key}'
        }
    )

    try:
        with urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            return result['choices'][0]['message']['content']
    except URLError as e:
        return f'Ошибка при обращении к AI: {str(e)}'
