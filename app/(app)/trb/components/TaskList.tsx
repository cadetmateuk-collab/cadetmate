import { useState, useMemo } from "react";
import type { TRBTask, TaskCategory } from "../data/trbTasks";
import { categories } from "../data/trbTasks";
import TaskItem from "./TaskItem";

interface TaskListProps {
  tasks: TRBTask[];
  searchTerm: string;
}

const TaskList = ({ tasks, searchTerm }: TaskListProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<TaskCategory | "All">("All");

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (activeCategory !== "All") {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.code.toLowerCase().includes(lower) ||
          t.description.toLowerCase().includes(lower) ||
          t.category.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [tasks, searchTerm, activeCategory]);

  return (
    <div>
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        <button
          onClick={() => setActiveCategory("All")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            activeCategory === "All"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/30"
          }`}
        >
          All ({tasks.length})
        </button>
        {categories.map((cat) => {
          const count = tasks.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Task count */}
      <p className="text-xs text-muted-foreground mb-4">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </p>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-semibold mb-1">No tasks found</p>
          <p className="text-sm">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3" role="list">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isExpanded={expandedId === task.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === task.id ? null : task.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
