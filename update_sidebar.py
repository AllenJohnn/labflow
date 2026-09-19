import re

with open(r"D:\Personal Project\labflow\src\components\layout\StudentSidebar.jsx", "r") as f:
    content = f.read()

# Add useState import
if "useState" not in content:
    content = content.replace('import { NavLink } from "react-router-dom";', 'import { useState } from "react";\nimport { NavLink } from "react-router-dom";')

# Add ChevronLeft, ChevronRight to lucide-react
if "ChevronLeft" not in content:
    content = content.replace("Terminal,\n} from \"lucide-react\";", "Terminal,\n  ChevronLeft,\n  ChevronRight,\n} from \"lucide-react\";")

# Add state
content = content.replace(
    'const { logout } = useAuth();',
    'const { logout } = useAuth();\n  const [isCollapsed, setIsCollapsed] = useState(false);'
)

# Update Menu header
content = content.replace(
    '<div className="px-3 pb-2.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">\n            Menu\n          </div>',
    '{!isCollapsed && (\n            <div className="px-3 pb-2.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">\n              Menu\n            </div>\n          )}'
)

# Update navitems
content = re.sub(
    r'<Icon className="h-4 w-4 shrink-0" />\s*<span>\{item\.name\}</span>',
    '<Icon className="h-4 w-4 shrink-0" />\n                {!isCollapsed && <span>{item.name}</span>}',
    content
)

# Update Account header
content = content.replace(
    '<div className="px-3 pb-2.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">\n          Account\n        </div>',
    '{!isCollapsed && (\n          <div className="px-3 pb-2.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">\n            Account\n          </div>\n        )}'
)

# Update Profile link text
content = content.replace(
    '<User className="h-4 w-4 shrink-0" />\n          <span>Profile</span>',
    '<User className="h-4 w-4 shrink-0" />\n          {!isCollapsed && <span>Profile</span>}'
)

# Update Sign out link text
content = content.replace(
    '<LogOut className="h-4 w-4 shrink-0 text-slate-400" />\n          <span>Sign Out</span>',
    '<LogOut className="h-4 w-4 shrink-0 text-slate-400" />\n          {!isCollapsed && <span>Sign Out</span>}'
)

# Add collapse toggle button at the bottom of sidebarContent
content = content.replace(
    '</button>\n      </div>\n    </div>\n  );',
    '</button>\n      </div>\n      <button\n        onClick={() => setIsCollapsed(!isCollapsed)}\n        className="hidden lg:flex items-center justify-center w-full mt-4 py-2 text-slate-400 hover:text-slate-600 border-t border-slate-100"\n      >\n        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}\n      </button>\n    </div>\n  );'
)

# Update desktop aside width
content = content.replace(
    '<aside className="hidden w-60 shrink-0 lg:block">',
    '<aside className={`hidden shrink-0 lg:block transition-all duration-300 ${isCollapsed ? "w-[72px]" : "w-60"}`}>'
)

with open(r"D:\Personal Project\labflow\src\components\layout\StudentSidebar.jsx", "w") as f:
    f.write(content)

print("Done")
