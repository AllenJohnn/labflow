import re

file_path = 'backend/app/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''from app.database.mongodb import db_wrapper

@asynccontextmanager
async def lifespan(app: FastAPI):
    db_wrapper.connect()
    asyncio.create_task(async_db_init())
    yield
    db_wrapper.close()'''

content = re.sub(r'@asynccontextmanager\nasync def lifespan\(app: FastAPI\):\n    asyncio\.create_task\(async_db_init\(\)\)\n    yield', replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated main.py")
