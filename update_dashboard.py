import re

with open(r"D:\Personal Project\labflow\src\pages\student\Dashboard.jsx", "r") as f:
    content = f.read()

if "FolderOpen" not in content:
    content = content.replace('ShieldCheck,\n} from "lucide-react";', 'ShieldCheck,\n  FolderOpen,\n} from "lucide-react";')

empty_state = """
          ) : laboratories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
              <FolderOpen className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-[14px] font-medium text-slate-600">No assigned laboratories.</p>
              <p className="text-[12px] text-slate-400 mt-1">When you are assigned to a lab, it will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
"""

content = content.replace(
    ') : (\n            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">',
    empty_state
)

skeleton_state = """<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-[200px] rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse mb-3"></div>
                    <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="h-5 w-16 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>"""

content = re.sub(
    r'<div className="grid grid-cols-1 gap-6 md:grid-cols-3">\s*\{\[1, 2, 3\]\.map\(\(n\) => \(\s*<div\s*key=\{n\}\s*className="h-52 border border-slate-200/80 bg-slate-50/60 p-6"\s*/>\s*\)\)\}\s*</div>',
    skeleton_state,
    content
)

with open(r"D:\Personal Project\labflow\src\pages\student\Dashboard.jsx", "w") as f:
    f.write(content)

print("Done Dashboard")
