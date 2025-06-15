
import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export type TimePeriod = "day" | "week" | "month" | "year" | "all";

interface TimePeriodSelectProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
  className?: string;
}

const timePeriodOptions: { label: string; value: TimePeriod }[] = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" },
];

const TimePeriodSelect: React.FC<TimePeriodSelectProps> = ({ value, onChange, className }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className={className || "w-[150px] bg-white"}>
      <SelectValue>
        {timePeriodOptions.find((opt) => opt.value === value)?.label || "This Month"}
      </SelectValue>
    </SelectTrigger>
    <SelectContent className="z-50 bg-white">
      {timePeriodOptions.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default TimePeriodSelect;
