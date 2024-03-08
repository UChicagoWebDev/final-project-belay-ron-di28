create table messages (
    id INTEGER PRIMARY KEY
    , user_id INTEGER
    , channel_id INTEGER 
    , body TEXT
    , replies_to INTEGER
    , FOREIGN KEY(user_id) REFERENCES users(id)
    , FOREIGN KEY(channel_id) REFERENCES channels(id)
)