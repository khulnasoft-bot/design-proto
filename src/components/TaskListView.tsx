import { useState, useMemo } from "react";
import { Project, Task, Priority } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  LayoutList, 
  CheckCircle2, 
  Circle,
  Flag,
  Calendar,
  MoreVertical,
  X,
  PlusCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";

interface TaskListViewProps {
  project: Project;
  onUpdateTasks: (tasks: Task[]) => void;
}

export function TaskListView({ project, onUpdateTasks }: TaskListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');

  const tasks = project.tasks || [];

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    if (filter === 'active') {
      result = result.filter(t => !t.completed);
    } else if (filter === 'completed') {
      result = result.filter(t => t.completed);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }

    // Sort by priority then by created date
    const priorityMap = { high: 0, medium: 1, low: 2 };
    return [...result].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (priorityMap[a.priority] !== priorityMap[b.priority]) {
        return priorityMap[a.priority] - priorityMap[b.priority];
      }
      return b.createdAt - a.createdAt;
    });
  }, [tasks, filter, searchQuery]);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      title: newTaskTitle,
      description: newTaskDescription,
      completed: false,
      priority: newTaskPriority,
      createdAt: Date.now()
    };

    onUpdateTasks([...tasks, newTask]);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority('medium');
    setIsAdding(false);
    toast.success("Task added");
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    onUpdateTasks(updatedTasks);
    toast.success("Task deleted");
  };

  const activeCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="h-full flex flex-col p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
            EngOps Tasks
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Manage project objectives and operational tasks</p>
        </div>
        
        <div className="flex items-center bg-zinc-900 rounded-lg p-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilter('all')}
            className={cn("h-8 px-3 text-xs rounded-md", filter === 'all' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500")}
          >
            All
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilter('active')}
            className={cn("h-8 px-3 text-xs rounded-md", filter === 'active' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500")}
          >
            Active ({activeCount})
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilter('completed')}
            className={cn("h-8 px-3 text-xs rounded-md", filter === 'completed' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500")}
          >
            Completed
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-500">
            <Plus className="w-4 h-4 mr-2" /> New Task
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-4 pb-20">
          <AnimatePresence mode="popLayout">
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-blue-500/50 bg-blue-500/5 backdrop-blur-sm shadow-xl shadow-blue-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold uppercase tracking-widest text-blue-400">Add New Objective</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="h-8 w-8 text-zinc-500">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input 
                      placeholder="Objective title..." 
                      className="bg-zinc-950 border-zinc-800 focus:border-blue-500/50"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      autoFocus
                    />
                    <Textarea 
                      placeholder="Add details or context..." 
                      className="bg-zinc-950 border-zinc-800 min-h-[80px]"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Priority:</span>
                        <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-900">
                          {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                            <button
                              key={p}
                              onClick={() => setNewTaskPriority(p)}
                              className={cn(
                                "px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-md transition-all",
                                newTaskPriority === p 
                                  ? p === 'high' ? "bg-red-500/20 text-red-400" : p === 'medium' ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-800 text-zinc-300"
                                  : "text-zinc-600 hover:text-zinc-400"
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-zinc-500">Cancel</Button>
                        <Button size="sm" onClick={handleAddTask} className="bg-blue-600 hover:bg-blue-500">Create Objective</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {filteredTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <div className="h-20 w-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <LayoutList className="h-10 w-10 text-zinc-700" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-400">No tasks found</h3>
                <p className="text-zinc-600 max-w-sm mx-auto mt-2">
                  {searchQuery ? "Try adjusting your search query." : "All systems go. Your operational backlog is clear."}
                </p>
                {!isAdding && !searchQuery && (
                  <Button variant="outline" className="mt-8 border-zinc-800 text-zinc-400" onClick={() => setIsAdding(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create First Task
                  </Button>
                )}
              </motion.div>
            ) : (
              filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={cn(
                    "group border-zinc-800 hover:border-zinc-700 transition-all",
                    task.completed && "opacity-60 bg-zinc-900/30"
                  )}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <Checkbox 
                        checked={task.completed} 
                        onCheckedChange={() => handleToggleTask(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn(
                            "text-sm font-semibold truncate",
                            task.completed ? "text-zinc-500 line-through" : "text-zinc-100"
                          )}>
                            {task.title}
                          </h4>
                          <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'} className="text-[9px] h-4 uppercase tracking-tighter pt-[1px]">
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className={cn(
                            "text-xs leading-relaxed line-clamp-2",
                            task.completed ? "text-zinc-600" : "text-zinc-400"
                          )}>
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                            <Flag className={cn(
                              "w-3 h-3",
                              task.priority === 'high' ? "text-red-500" : task.priority === 'medium' ? "text-yellow-500" : "text-zinc-700"
                            )} />
                            Priority {task.priority}
                          </div>
                        </div>
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-600 hover:text-red-400"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
