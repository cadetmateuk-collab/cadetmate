import type { TaskStep } from "../data/trbTasks";
import { ImageIcon, Lightbulb } from "lucide-react";
import { NoCopy } from "@/components/NoCopy";

interface TaskDetailsProps {
  steps: TaskStep[];
  guidance?: string;
}

const TaskDetails = ({ steps, guidance }: TaskDetailsProps) => {
  return (
    <NoCopy className="px-5 pb-5 pt-1">
      <div className="border-t border-border pt-5">
        {/* Guidance section */}
        {guidance && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-accent/30 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <Lightbulb size={16} className="flex-shrink-0 text-primary mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.07em] text-primary mb-1.5">
                  Guidance & Tips
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {guidance}
                </p>
              </div>
            </div>
          </div>
        )}

        <h4 className="text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground mb-4">
          Step-by-step tasks
        </h4>
        <ol className="space-y-4" role="list">
          {steps.map((step) => (
            <li key={String(step.step)} className="flex gap-3.5">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                {step.step}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
                {step.imagePlaceholder && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                    <ImageIcon size={14} />
                    <span>{step.imagePlaceholder}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </NoCopy>
  );
};

export default TaskDetails;
