import { Search } from "lucide-react";
import { Input } from "@hr/components/ui/input";
import { useDebouncedInput } from "@hr/hooks/useDebouncedInput";

interface UserSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export const UserSearchBar = ({
  searchTerm,
  onSearchChange,
  placeholder = "Search by name, email or role...",
}: UserSearchBarProps) => {
  const { localValue, handleChange } = useDebouncedInput(searchTerm, onSearchChange);

  return (
    <div className="relative max-w-md mb-6">
      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        className="pl-9 sm:pl-9"
      />
    </div>
  );
};
