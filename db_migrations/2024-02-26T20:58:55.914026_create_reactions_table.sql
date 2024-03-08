create table reactions (
    id INTEGER PRIMARY KEY
    , user_id INTEGER
    , message_id INTEGER 
    , emoji TEXT
    , FOREIGN KEY(user_id) REFERENCES users(id)
    , FOREIGN KEY(message_id) REFERENCES messages(id)
)