import pytest
from app.main import app
import asyncio

@pytest.fixture(autouse=True)
async def app_lifespan():
    async with app.router.lifespan_context(app):
        yield
