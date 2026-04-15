import { categoryBgColors, type TaskCategory } from "../data/trbTasks";

interface CategoryBadgeProps {
  category: TaskCategory;
}

const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold border ${categoryBgColors[category]}`}
    >
      {category}
    </span>
  );
};

export default CategoryBadge;
