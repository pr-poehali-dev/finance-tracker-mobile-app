import json
import os
from datetime import datetime, timedelta
import jwt
import psycopg2
from urllib.parse import urlencode, parse_qs
import requests

def handler(event: dict, context) -> dict:
    '''API для авторизации пользователей через Google OAuth'''
    
    method = event.get('httpMethod', 'GET')
    path = event.get('requestContext', {}).get('http', {}).get('path', '')
    query_params = event.get('queryStringParameters') or {}
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET' and 'code' in query_params:
        return handle_google_callback(query_params)
    
    if method == 'GET' and 'login' in query_params:
        return initiate_google_login()
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        if 'token' in body:
            return verify_token(body['token'])
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid request'}),
        'isBase64Encoded': False
    }

def initiate_google_login() -> dict:
    '''Инициирует процесс авторизации через Google'''
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    redirect_uri = 'https://functions.poehali.dev/8b7a1651-e473-4bba-865c-e549f7445219'
    
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'online'
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    return {
        'statusCode': 302,
        'headers': {
            'Location': auth_url,
            'Access-Control-Allow-Origin': '*'
        },
        'body': '',
        'isBase64Encoded': False
    }

def handle_google_callback(query_params: dict) -> dict:
    '''Обрабатывает ответ от Google OAuth'''
    code = query_params.get('code')
    
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    redirect_uri = 'https://functions.poehali.dev/8b7a1651-e473-4bba-865c-e549f7445219'
    
    token_response = requests.post('https://oauth2.googleapis.com/token', data={
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    })
    
    token_data = token_response.json()
    access_token = token_data.get('access_token')
    
    user_info_response = requests.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    user_info = user_info_response.json()
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    cur.execute(f'''
        INSERT INTO {schema}.users (google_id, email, name, avatar_url)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (google_id) DO UPDATE 
        SET email = EXCLUDED.email, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
        RETURNING id, email, name, avatar_url
    ''', (
        user_info['id'],
        user_info['email'],
        user_info.get('name'),
        user_info.get('picture')
    ))
    
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    jwt_secret = os.environ.get('JWT_SECRET')
    token = jwt.encode({
        'user_id': user[0],
        'email': user[1],
        'exp': datetime.utcnow() + timedelta(days=30)
    }, jwt_secret, algorithm='HS256')
    
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    
    return {
        'statusCode': 302,
        'headers': {
            'Location': f"{frontend_url}?token={token}",
            'Access-Control-Allow-Origin': '*'
        },
        'body': '',
        'isBase64Encoded': False
    }

def verify_token(token: str) -> dict:
    '''Проверяет JWT токен и возвращает информацию о пользователе'''
    jwt_secret = os.environ.get('JWT_SECRET')
    
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        
        conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
        cur = conn.cursor()
        
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        cur.execute(f'''
            SELECT id, email, name, avatar_url FROM {schema}.users WHERE id = %s
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
                    'name': user[2],
                    'avatar_url': user[3]
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