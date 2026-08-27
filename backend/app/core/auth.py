import time
import urllib.request
import json
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from jose import jwk

from app.core.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer()

SECRET = settings.supabase_jwt_secret or settings.supabase_anon_key

# Supabase signs session tokens using asymmetric keys (RS256 / ES256), published
# at {issuer}/.well-known/jwks.json. The "JWT secret" shown in the dashboard is
# actually the key id (kid) for the ES256 key on the project issuer — not an
# HMAC secret. We therefore always verify against the JWKS derived from the
# token's issuer, falling back to legacy HS256 with the anon key.
DEFAULT_ISSUER = "https://supabase.co/auth/v1"

_jwks_cache: dict = {}
_jwks_issuer: str = ""
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600.0


def _derive_issuer(token: str) -> str:
    try:
        claims = jwt.get_unverified_claims(token)
        return claims.get("iss", DEFAULT_ISSUER)
    except Exception:
        return DEFAULT_ISSUER


def _fetch_jwks(issuer: str) -> list:
    global _jwks_cache, _jwks_issuer, _jwks_fetched_at
    now = time.time()
    if _jwks_cache and _jwks_issuer == issuer and (now - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache

    url = f"{issuer.rstrip('/')}/.well-known/jwks.json"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        keys = data.get("keys", [])
        _jwks_cache = keys
        _jwks_issuer = issuer
        _jwks_fetched_at = now
        return keys
    except Exception as exc:  # pragma: no cover - network error path
        logger.warning("Failed to fetch JWKS from %s: %s", url, exc)
        return _jwks_cache if _jwks_issuer == issuer else []


def _verify_jwks(token: str, audience: str, alg: str) -> dict:
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    issuer = _derive_issuer(token)
    keys = _fetch_jwks(issuer)

    # Prefer the key matching the token's kid, then any key supporting `alg`.
    matched = []
    if kid:
        matched = [k for k in keys if k.get("kid") == kid]
    if not matched:
        matched = [k for k in keys if k.get("alg") == alg]

    errors = []
    for key in matched:
        try:
            public_key = jwk.construct(key)
            # EC keys verify with to_pem(); RSA keys expose .public_key
            if hasattr(public_key, "to_pem"):
                key_or_pem = public_key.to_pem()
            else:
                key_or_pem = public_key
            return jwt.decode(
                token,
                key_or_pem,
                algorithms=[alg],
                audience=audience,
                issuer=issuer,
            )
        except JWTError as exc:
            errors.append(str(exc))
    raise JWTError(" | ".join(errors) or f"No valid {alg} key from {issuer}")


def decode_token(token: str) -> dict:
    audience = "authenticated"
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    alg = unverified_header.get("alg", "")

    # Asymmetric algorithms -> validate against Supabase JWKS public key
    if alg in ("RS256", "ES256", "RS384", "RS512", "ES384", "ES512"):
        try:
            return _verify_jwks(token, audience, alg)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

    # HS256 -> legacy HMAC secret fallback
    try:
        return jwt.decode(
            token,
            SECRET,
            algorithms=["HS256"],
            audience=audience,
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    return decode_token(credentials.credentials)


def get_user_id(user: dict) -> str:
    sub = user.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    return sub
