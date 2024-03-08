create table last_message_seen (
    user_id INTEGER
    , channel_id INTEGER 
    , last_message_id INTEGER
    , FOREIGN KEY(user_id) REFERENCES users(id)
    , FOREIGN KEY(channel_id) REFERENCES channels(id)
    , FOREIGN KEY(last_message_id) REFERENCES messages(id)
)