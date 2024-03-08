import os
from flask import *
import string
import sqlite3
import random
from functools import wraps


app = Flask(__name__, static_folder=os.path.join('../app', 'build'))

# Helper function to get database
def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('belay.db')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db


# Close the database connection 
@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Helper function to query the database
def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None

# Creates a new user and inserts the user into the database
def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' + 
        'values (?, ?, ?) returning id, name, password, api_key',
        (name, password, api_key),
        one=True)
    return u


def get_user_from_api_key(api_key):
    if api_key:
        return query_db('select * from users where api_key = ?', [api_key], one=True)
    return None


def get_api_key_from_user(username, password):
    if username and password:
        return query_db('select * from users where name = ? and password = ?', [username, password], one=True)
    return None


def api_key_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('API-Key')
        user = get_user_from_api_key(api_key)
        print('checked api')
        if user is None:
            return jsonify({'error': 'Invalid API key'}), 401
        g.user = user
        return f(*args, **kwargs)
    return decorated_function


# Main app route
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(use_reloader=True, port=5000, threaded=True)



# -------------------------------- API ROUTES ---------------------------------- 

# -------------------------------- LOGIN SIGNUP ROUTES ---------------------------------- 

@app.route('/api/checkcredentials', methods=['POST'])
def check_credentials_for_login():
    api_key = request.headers.get('API-Key')
    user = get_user_from_api_key(api_key)
    if user is None:
        # No user found with the provided API key
        return jsonify({'error': 'Invalid API key'}), 401  

    # User found, proceed as normal
    print(f"User gotten: Username={user['name']}, Password={user['password']}, API Key={user['api_key']}, ID = {user['id']}")
    return jsonify({
        'username': user['name'],
        'password': user['password'], 
        'user_id': user['id']
    })


@app.route('/api/signup', methods=['POST'])
def signup():
    user = new_user()
    print(f"User created: Username={user['name']}, Password={user['password']}, API Key={user['api_key']}")
    return jsonify({
        'username': user['name'],  
        'password': user['password'],  
        'api_key': user['api_key']
    })


@app.route('/api/login', methods=['GET'])
def login():
    username = request.headers.get('Username')
    password = request.headers.get('Password')

    user = get_api_key_from_user(username, password)
    if user is None:
        return jsonify({'error': 'User not found'}), 401
    
    print(f"API key found: Username={user['name']}, Password={user['password']}, API Key={user['api_key']}")
    return jsonify({
        'api_key': user['api_key']
    })



# -------------------------------- MAIN ROUTES NEED API CHECK ---------------------------------- 

@app.route('/api/channels', methods=['GET'])
@api_key_required
def get_channels():
    print("Fetching channels")
    channels = query_db('SELECT * FROM channels')
    return jsonify([dict(channel) for channel in channels])



@app.route('/api/user/username', methods=['POST'])
@api_key_required
def change_username():
    print("change username")
    data = request.get_json()
    print(data['new_username'])
    user_id = g.user['id']
    if not data:
        return jsonify({'error': 'Missing new_username'}), 400
    else:
        new_username = data['new_username']
        query_db('update users set name = ? where id = ?', [new_username, user_id])

    return jsonify({'message': 'Username updated successfully'})


@app.route('/api/user/password', methods=['POST'])
@api_key_required
def change_password():
    print("change password")
    data = request.get_json()
    user_id = g.user['id']
    if not data:
        return jsonify({'error': 'Missing password'}), 400
    else:
        password = data['new_password']
        query_db('update users set password = ? where id = ?', [password, user_id])

    return jsonify({'message': 'Password updated successfully'})


@app.route('/api/channels/<channel_id>/messages', methods=['GET'])
@api_key_required
def get_messages(channel_id):
    print(channel_id)
    print("get messages")
    
    message_query = query_db('SELECT u.name, m.body, m.id, COUNT(DISTINCT m2.id) as num_replies FROM messages m LEFT JOIN messages m2 ON m.id = m2.replies_to LEFT JOIN users u ON m.user_id = u.id WHERE m.replies_to IS NULL AND m.channel_id = ? GROUP BY m.id, u.name, m.body ORDER BY m.id ASC', [channel_id])
    
    messages = [dict(msg) for msg in message_query] if message_query else []
    
    for msg in messages:
        # Fetch reactions for the message
        reaction_query = query_db('SELECT r.emoji, GROUP_CONCAT(u.name) as user_names FROM reactions r JOIN users u ON r.user_id = u.id WHERE r.message_id = ? GROUP BY r.emoji', [msg['id']])
        reactions = [dict(reaction) for reaction in reaction_query] if reaction_query else []
        
        # Convert user_names string back to list (split by comma)
        for reaction in reactions:
            reaction['userNames'] = reaction['user_names'].split(',') if reaction.get('user_names') else []
            del reaction['user_names']  # Clean up the reaction dict
        
        msg['reactions'] = reactions
        
        print(f"Message ID: {msg['id']}, User Name: {msg['name']}, Message: {msg['body']}, Reactions: {msg['reactions']}")
    
    return jsonify(messages)

        
@app.route('/api/channels/<channel_id>/messages', methods=['POST'])
@api_key_required
def post_message(channel_id):
    print("posted a message")
    user_id = g.user['id']
    message_body = request.json.get('message')
    query_db('INSERT INTO messages (channel_id, user_id, body) VALUES (?, ?, ?)', [channel_id, user_id, message_body])
    return jsonify({'message': 'Message posted successfully'}), 201



@app.route('/api/messages/<message_id>/replies', methods=['GET'])
@api_key_required
def get_replies(message_id):
    print("get message replies")

    message_replies = []

    message_replies_query = query_db('SELECT u.name, m.body, m.id FROM messages m LEFT JOIN users u ON m.user_id = u.id WHERE replies_to = ?', [message_id])
    if message_replies_query:
        message_replies = [dict(reply) for reply in message_replies_query]
    
    parent_message_query = query_db('SELECT u.name, m.body, m.id FROM messages m LEFT JOIN users u ON m.user_id = u.id WHERE m.id = ?', [message_id], one=True)
    parent_message = dict(parent_message_query) if parent_message_query else None
    if parent_message:
        print(f"Parent Message ID: {parent_message['id']}, User Name: {parent_message['name']}, Message: {parent_message['body']}")

    #Prepare the response object
    response = {
        'parentMessage': parent_message,
        'replies': message_replies if message_replies else []
    }
    
    return jsonify(response)
        

@app.route('/api/messages/<message_id>/replies', methods=['POST'])
@api_key_required
def post_reply(message_id):
    user_id = g.user['id']
    message_body = request.json.get('message')

    channel_id = query_db('SELECT channel_id FROM messages WHERE id = ?', [message_id], one=True)

    query_db('INSERT INTO messages (channel_id, user_id, body, replies_to) VALUES (?, ?, ?, ?)', [channel_id['channel_id'], user_id, message_body, message_id])
    return jsonify({'message': 'Reply posted successfully'}), 201



@app.route('/api/channels/new', methods=['POST'])
@api_key_required
def create_channel():
    print("create channel")
    channel_name = request.json.get('name')
    print(channel_name)
    channel = query_db('insert into channels (name) values (?) returning id', [channel_name], one=True)
    return jsonify({
        'channel_id': channel['id']
    })


@app.route('/api/messages/<message_id>/reactions', methods=['POST'])
@api_key_required
def add_reaction(message_id):
    user_id = g.user['id']
    emoji = request.json.get('emoji')

    if not emoji:
        return jsonify({'error': 'Emoji is required'}), 400

    # Insert reaction into the database
    query_db('INSERT INTO reactions (user_id, message_id, emoji) VALUES (?, ?, ?)', 
             [user_id, message_id, emoji])

    return jsonify({'message': 'Reaction added successfully'}), 201


@app.route('/api/channels/<channel_id>/access', methods=['POST'])
@api_key_required
def update_last_message_seen(channel_id):
    user_id = g.user['id']
    # Find the max message_id in the channel
    max_message_id_query = query_db('SELECT COUNT(*) as max_id FROM messages WHERE channel_id = ?', [channel_id], one=True)
    max_message_id = max_message_id_query['max_id'] if max_message_id_query else 0  # Default to 0 if no messages
    
    # Check if a record already exists
    exists = query_db('SELECT 1 FROM last_message_seen WHERE user_id = ? AND channel_id = ?', [user_id, channel_id], one=True)
    
    if exists:
        # Update the record if it exists
        query_db('UPDATE last_message_seen SET last_message_id = ? WHERE user_id = ? AND channel_id = ?', [max_message_id, user_id, channel_id])
    else:
        # Insert a new record if it does not exist
        query_db('INSERT INTO last_message_seen (user_id, channel_id, last_message_id) VALUES (?, ?, ?)', [user_id, channel_id, max_message_id])
    
    return jsonify({'success': True})


@app.route('/api/channels/access', methods=['GET'])
@api_key_required
def get_unread_messages():
    user_id = g.user['id']

    unread_messages_query = query_db('SELECT m.channel_id, COUNT(m.id)-COALESCE(lms.last_message_id, 0) as unread_messages FROM messages m LEFT JOIN (SELECT * FROM last_message_seen WHERE user_id = ?) lms ON m.channel_id = lms.channel_id GROUP BY 1', [user_id])
    unread_messages = [dict(row) for row in unread_messages_query] if unread_messages_query else []
    return jsonify(unread_messages)
