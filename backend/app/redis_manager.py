import redis

redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)


def publish_message(channel:str, message: str):
    redis_client.publish(channel, message)
    
def subuscribe_to_channel(channel: str):
    pubsub = redis_client.pubsub()
    pubsub.subscribe(channel)
    return pubsub


    