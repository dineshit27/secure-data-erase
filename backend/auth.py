import os
from typing import Any, Dict

import httpx
from fastapi import Header, HTTPException


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").strip().lower() == "true"


async def get_current_user(authorization: str | None = Header(default=None)) -> Dict[str, Any]:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        if REQUIRE_AUTH:
            raise HTTPException(status_code=500, detail="Supabase auth is not configured on backend")
        return {"role": "guest"}

    if not authorization or not authorization.lower().startswith("bearer "):
        if REQUIRE_AUTH:
            raise HTTPException(status_code=401, detail="Missing bearer token")
        return {"role": "guest"}

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        if REQUIRE_AUTH:
            raise HTTPException(status_code=401, detail="Invalid bearer token")
        return {"role": "guest"}

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
            },
        )

    if response.status_code != 200:
        if REQUIRE_AUTH:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return {"role": "guest"}

    return response.json()
