import os

import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")


class ApiError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def _headers() -> dict:
    token = st.session_state.get("token")
    return {"Authorization": f"Bearer {token}"} if token else {}


def _handle(resp: requests.Response):
    if resp.status_code == 401:
        st.session_state.token = None
        st.session_state.advocate_email = None
        raise ApiError("Session expired, please log in again.", 401)
    if not resp.ok:
        try:
            detail = resp.json().get("detail", resp.text)
        except ValueError:
            detail = resp.text
        raise ApiError(str(detail), resp.status_code)
    if resp.status_code == 204 or not resp.content:
        return None
    return resp.json()


def signup(full_name: str, email: str, password: str) -> dict:
    resp = requests.post(
        f"{API_BASE_URL}/auth/signup",
        json={"full_name": full_name, "email": email, "password": password},
        timeout=10,
    )
    return _handle(resp)


def login(email: str, password: str) -> dict:
    resp = requests.post(
        f"{API_BASE_URL}/auth/login",
        data={"username": email, "password": password},
        timeout=10,
    )
    return _handle(resp)


def list_cases() -> list:
    resp = requests.get(f"{API_BASE_URL}/cases", headers=_headers(), timeout=10)
    return _handle(resp)


def create_case(payload: dict) -> dict:
    resp = requests.post(f"{API_BASE_URL}/cases", json=payload, headers=_headers(), timeout=10)
    return _handle(resp)


def get_case(case_id: int) -> dict:
    resp = requests.get(f"{API_BASE_URL}/cases/{case_id}", headers=_headers(), timeout=10)
    return _handle(resp)


def delete_case(case_id: int) -> None:
    resp = requests.delete(f"{API_BASE_URL}/cases/{case_id}", headers=_headers(), timeout=10)
    return _handle(resp)


def update_hearing(case_id: int, payload: dict) -> dict:
    resp = requests.post(
        f"{API_BASE_URL}/cases/{case_id}/hearings/update",
        json=payload,
        headers=_headers(),
        timeout=10,
    )
    return _handle(resp)
