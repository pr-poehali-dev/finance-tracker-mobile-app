import json
import os
from datetime import datetime, timedelta
import jwt
import psycopg2
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def handler(event: dict, context) -> dict:
    '''API для авторизации пользователей по email с 6-значным кодом'''
    
    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body', '{}')) if event.get('body') else {}
    
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
    
    if method == 'POST':
        action = body.get('action')
        
        if action == 'send_code':
            return send_verification_code(body.get('email'))
        
        elif action == 'verify_code':
            return verify_code(body.get('email'), body.get('code'))
        
        elif action == 'verify_token':
            return verify_token(body.get('token'))
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid request'}),
        'isBase64Encoded': False
    }

def send_verification_code(email: str) -> dict:
    '''Отправляет 6-значный код на email'''
    
    if not email or '@' not in email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid email'}),
            'isBase64Encoded': False
        }
    
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    cur.execute(f'''
        INSERT INTO {schema}.verification_codes (email, code, expires_at)
        VALUES (%s, %s, %s)
        ON CONFLICT (email) DO UPDATE 
        SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, created_at = CURRENT_TIMESTAMP
    ''', (email.lower(), code, expires_at))
    
    conn.commit()
    cur.close()
    conn.close()
    
    smtp_host = os.environ.get('SMTP_HOST')
    dev_mode = not smtp_host
    
    if not dev_mode:
        try:
            send_email(email, code)
            message = 'Code sent to email'
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Failed to send email: {str(e)}'}),
                'isBase64Encoded': False
            }
    else:
        message = f'DEV MODE: Your code is {code}'
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'message': message, 'dev_code': code if dev_mode else None}),
        'isBase64Encoded': False
    }

def send_email(to_email: str, code: str):
    '''Отправляет email с кодом'''
    
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Ваш код доступа: {code}'
    msg['From'] = smtp_user
    msg['To'] = to_email
    
    html = f'''
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #f97316;">Финансовый трекер</h2>
        <p>Ваш код для входа:</p>
        <h1 style="color: #f97316; font-size: 48px; letter-spacing: 8px;">{code}</h1>
        <p style="color: #666;">Код действителен 10 минут.</p>
        <p style="color: #999; font-size: 12px;">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
      </body>
    </html>
    '''
    
    msg.attach(MIMEText(html, 'html'))
    
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

def verify_code(email: str, code: str) -> dict:
    '''Проверяет код и возвращает JWT токен'''
    
    if not email or not code:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email and code required'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    cur.execute(f'''
        SELECT code, expires_at FROM {schema}.verification_codes
        WHERE email = %s
    ''', (email.lower(),))
    
    result = cur.fetchone()
    
    if not result:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Code not found'}),
            'isBase64Encoded': False
        }
    
    stored_code, expires_at = result
    
    if datetime.utcnow() > expires_at:
        cur.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Code expired'}),
            'isBase64Encoded': False
        }
    
    if str(stored_code).strip() != str(code).strip():
        cur.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid code'}),
            'isBase64Encoded': False
        }
    
    # Проверяем, существует ли пользователь
    cur.execute(f'''
        SELECT id, email, name FROM {schema}.users WHERE email = %s
    ''', (email.lower(),))
    
    user = cur.fetchone()
    
    # Если пользователя нет, создаём его
    if not user:
        cur.execute(f'''
            INSERT INTO {schema}.users (google_id, email, name)
            VALUES (%s, %s, %s)
            RETURNING id, email, name
        ''', ('', email.lower(), email.split('@')[0]))
        user = cur.fetchone()
    
    cur.execute(f'''
        DELETE FROM {schema}.verification_codes WHERE email = %s
    ''', (email.lower(),))
    
    conn.commit()
    cur.close()
    conn.close()
    
    jwt_secret = os.environ.get('JWT_SECRET')
    token = jwt.encode({
        'user_id': user[0],
        'email': user[1],
        'exp': datetime.utcnow() + timedelta(days=30)
    }, jwt_secret, algorithm='HS256')
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'token': token,
            'user': {
                'id': user[0],
                'email': user[1],
                'name': user[2]
            }
        }),
        'isBase64Encoded': False
    }

def verify_token(token: str) -> dict:
    '''Проверяет JWT токен и возвращает информацию о пользователе'''
    
    if not token:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Token required'}),
            'isBase64Encoded': False
        }
    
    jwt_secret = os.environ.get('JWT_SECRET')
    
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        
        conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
        cur = conn.cursor()
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        cur.execute(f'''
            SELECT id, email, name FROM {schema}.users WHERE id = %s
        ''', (payload['user_id'],))
        
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'name': user[2]
                }
            }),
            'isBase64Encoded': False
        }
    except jwt.ExpiredSignatureError:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Token expired'}),
            'isBase64Encoded': False
        }
    except jwt.InvalidTokenError:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid token'}),
            'isBase64Encoded': False
        }