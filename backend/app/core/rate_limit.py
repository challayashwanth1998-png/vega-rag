import time
from fastapi import HTTPException
from typing import Dict, Any

# In-memory token bucket store: { "bot_id": {"tokens": 50, "last_refill": 16000000} }
# Note: In a true multi-node cluster, this state should be moved to Redis (ElastiCache).
# For this implementation, it protects the individual ECS container from noisy neighbors.
_buckets: Dict[str, Dict[str, Any]] = {}

def check_rate_limit(bot_id: str, tier: str = "free"):
    """
    Enforces API Throttling using the Token Bucket Algorithm.
    Allows bursts of traffic up to the capacity, while strictly enforcing
    the refill rate to prevent noisy neighbors from degrading cluster performance.
    """
    # Tier configs: (capacity_burst, refill_rate_per_second)
    tiers = {
        "free": (20, 0.33),       # 20 req burst, refills 20 per minute
        "pro": (100, 1.66),       # 100 req burst, refills 100 per minute
        "enterprise": (500, 8.33) # 500 req burst, refills 500 per minute
    }
    
    capacity, refill_rate = tiers.get(tier.lower(), tiers["free"])
    now = time.time()
    
    if bot_id not in _buckets:
        _buckets[bot_id] = {"tokens": capacity, "last_refill": now}
        
    bucket = _buckets[bot_id]
    
    # 1. Refill tokens based on time elapsed since last check
    time_passed = now - bucket["last_refill"]
    new_tokens = time_passed * refill_rate
    
    bucket["tokens"] = min(float(capacity), bucket["tokens"] + new_tokens)
    bucket["last_refill"] = now
    
    # 2. Check if we have enough tokens to process this request
    if bucket["tokens"] >= 1.0:
        bucket["tokens"] -= 1.0
        return True
    else:
        # 3. Deny request and return 429 Too Many Requests with Retry-After header
        tokens_needed = 1.0 - bucket["tokens"]
        retry_after = int(tokens_needed / refill_rate) + 1
        
        raise HTTPException(
            status_code=429, 
            detail=f"Rate limit exceeded for tier '{tier}'.",
            headers={"Retry-After": str(retry_after)}
        )
