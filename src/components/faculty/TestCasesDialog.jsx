import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import api from "../../services/api";

export default function TestCasesDialog({ open, onOpenChange, exerciseId, initialTestCases = [], onSaved }) {
  const [testCases, setTestCases] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTestCases(initialTestCases.length > 0 ? JSON.parse(JSON.stringify(initialTestCases)) : []);
    }
  }, [open, initialTestCases]);

  const generateId = () => `tc-${Math.random().toString(36).substr(2, 9)}`;

  const addTestCase = () => {
    setTestCases([...testCases, { id: generateId(), input: "", expected_output: "", is_hidden: false }]);
  };

  const removeTestCase = (id) => {
    setTestCases(testCases.filter(tc => tc.id !== id));
  };

  const updateTestCase = (id, field, value) => {
    setTestCases(testCases.map(tc => tc.id === id ? { ...tc, [field]: value } : tc));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.put(`/faculty/exercises/${exerciseId}/test-cases`, testCases);
      toast.success("Test cases saved successfully");
      if (onSaved) onSaved(res.data.data.test_cases || testCases);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save test cases", err);
      toast.error(err.response?.data?.detail || "Failed to save test cases");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Automated Test Cases</span>
            <span className="text-sm font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              {testCases.length} configured
            </span>
          </DialogTitle>
          <DialogDescription>
            Configure input and expected output for automated Judge0 execution. Leave blank if not applicable.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
          {testCases.length === 0 ? (
            <div className="text-center py-10 px-4 border-2 border-dashed border-border rounded-lg bg-background">
              <h3 className="text-sm font-semibold text-foreground">No test cases configured</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                Students can still Run and Submit normally. Without test cases, the "Run Tests" button will be hidden.
              </p>
              <Button onClick={addTestCase} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add First Test Case
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {testCases.map((tc, index) => (
                <div key={tc.id} className="border border-border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-muted-foreground">#{index + 1}</span>
                      <button
                        onClick={() => updateTestCase(tc.id, "is_hidden", !tc.is_hidden)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                          tc.is_hidden 
                            ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" 
                            : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        }`}
                      >
                        {tc.is_hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {tc.is_hidden ? "Hidden" : "Public"}
                      </button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeTestCase(tc.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Body */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Standard Input</label>
                      <Textarea 
                        value={tc.input} 
                        onChange={(e) => updateTestCase(tc.id, "input", e.target.value)}
                        placeholder="e.g. 5 10" 
                        className="font-mono text-xs min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Expected Output</label>
                      <Textarea 
                        value={tc.expected_output} 
                        onChange={(e) => updateTestCase(tc.id, "expected_output", e.target.value)}
                        placeholder="e.g. 15" 
                        className="font-mono text-xs min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button onClick={addTestCase} variant="outline" className="w-full border-dashed border-2 py-6 text-muted-foreground hover:text-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add Test Case
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-background">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Test Cases</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
