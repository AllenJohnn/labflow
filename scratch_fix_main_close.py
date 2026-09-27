import re

file_path = 'backend/app/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('db_wrapper.close()', 'await db_wrapper.close()')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated main.py close await")
