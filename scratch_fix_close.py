import re

file_path = 'backend/app/database/mongodb.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'    def close\(self\):', '    async def close(self):', content)
content = re.sub(r'        if self\.client:\n            self\.client\.close\(\)', '        if self.client:\n            await self.client.close()', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated mongodb.py close method")
