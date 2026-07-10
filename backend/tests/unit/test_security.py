from datetime import timedelta
from jose import JWTError

from app.core.security import hash_password, verify_password, create_access_token, verify_token
from app.services.auth_service import LoginAttemptTracker


class TestPasswordHashing:
    def test_hash_and_verify_password(self):
        password = "Junior11"
        hashed = hash_password(password)
        assert hashed != password
        assert verify_password(password, hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("Junior11")
        assert verify_password("WrongPass1", hashed) is False

    def test_different_hash_each_time(self):
        password = "Junior11"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        assert hash1 != hash2


class TestJWT:
    def test_create_and_verify_token(self):
        data = {"sub": "1", "email": "test@gmail.com", "rol": "huesped"}
        token = create_access_token(data, expires_delta=timedelta(minutes=30))
        payload = verify_token(token)
        assert payload["sub"] == "1"
        assert payload["email"] == "test@gmail.com"
        assert payload["rol"] == "huesped"

    def test_token_expired(self):
        data = {"sub": "1", "email": "test@gmail.com", "rol": "huesped"}
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))
        import pytest
        with pytest.raises(JWTError):
            verify_token(token)

    def test_token_invalid_signature(self):
        token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid"
        import pytest
        with pytest.raises(JWTError):
            verify_token(token)

    def test_payload_contains_exp(self):
        data = {"sub": "1"}
        token = create_access_token(data, expires_delta=timedelta(minutes=30))
        payload = verify_token(token)
        assert "exp" in payload


class TestLoginAttemptTracker:
    def test_not_blocked_on_first_attempt(self):
        tracker = LoginAttemptTracker()
        assert tracker.is_blocked("test@gmail.com") is False

    def test_blocked_after_max_attempts(self):
        tracker = LoginAttemptTracker()
        for _ in range(5):
            tracker.record_attempt("test@gmail.com")
        assert tracker.is_blocked("test@gmail.com") is True

    def test_not_blocked_below_max_attempts(self):
        tracker = LoginAttemptTracker()
        for _ in range(3):
            tracker.record_attempt("test@gmail.com")
        assert tracker.is_blocked("test@gmail.com") is False

    def test_reset_clears_attempts(self):
        tracker = LoginAttemptTracker()
        for _ in range(5):
            tracker.record_attempt("test@gmail.com")
        tracker.reset("test@gmail.com")
        assert tracker.is_blocked("test@gmail.com") is False

    def test_different_emails_independent(self):
        tracker = LoginAttemptTracker()
        for _ in range(5):
            tracker.record_attempt("blocked@gmail.com")
        tracker.record_attempt("free@gmail.com")
        assert tracker.is_blocked("blocked@gmail.com") is True
        assert tracker.is_blocked("free@gmail.com") is False
