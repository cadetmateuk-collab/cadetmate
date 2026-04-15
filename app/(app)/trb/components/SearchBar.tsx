import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative max-w-[480px] mx-auto mb-10">
      <Search
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <input
        type="text"
        placeholder="Search tasks…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-3 pl-11 pr-4 bg-background border border-border rounded-[0.625rem] text-[0.9375rem] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 font-[inherit]"
        aria-label="Search training tasks"
      />
    </div>
  );
};

export default SearchBar;
