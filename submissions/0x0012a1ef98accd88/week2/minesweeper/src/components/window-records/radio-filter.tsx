import { Level } from "@/types";

interface RadioFilterProps {
  filters: (Level | "all")[] | ("win" | "lose" | "all")[];
  filter: Level | "all" | "win" | "lose";
  name: string;
  handleUpdate: (value: Level | "all" | "win" | "lose") => void;
}

const RadioFilter = ({ filters, filter, name, handleUpdate }: RadioFilterProps) => {
  return (
    <div className="flex gap-2 mb-2">
      {filters.map((f) => (
        <label key={f} className="flex items-center gap-1">
          <input
            type="radio"
            name={name}
            value={f}
            checked={filter === f}
            onChange={() => handleUpdate(f)}
          />
          <span className="capitalize">{f}</span>
        </label>
      ))}
    </div>
  );
};

export default RadioFilter;
