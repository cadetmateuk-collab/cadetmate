import { ChevronDown } from "lucide-react";
import type { TRBTask } from "../data/trbTasks";
import CategoryBadge from "./CategoryBadge";
import TaskDetails from "./TaskDetails";

interface TaskItemProps {
  task: TRBTask;
  isExpanded: boolean;
  onToggle: () => void;
}

const TaskItem = ({ task, isExpanded, onToggle }: TaskItemProps) => {
  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isExpanded
          ? "border-primary/30 bg-card shadow-[0_8px_32px_hsl(199_89%_48%/0.1)]"
          : "border-border bg-card hover:border-primary/20 hover:shadow-[0_4px_20px_hsl(199_89%_48%/0.06)]"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer group"
        aria-expanded={isExpanded}
        aria-controls={`task-details-${task.id}`}
      >
        <span className="flex-shrink-0 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md tracking-wide">
          {task.code}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {task.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {task.description}
          </p>
        </div>
        <CategoryBadge category={task.category} />
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div
          id={`task-details-${task.id}`}
          role="region"
          aria-label={`Details for ${task.title}`}
          className="animate-fade-up-1"
        >
          <TaskDetails steps={task.steps} guidance={task.guidance} />
        </div>
      )}
    </div>
  );
};

export default TaskItem;
