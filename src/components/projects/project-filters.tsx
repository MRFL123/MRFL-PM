"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DATE_FILTERS,
  PROJECT_TYPES,
  STATUSES,
  type DateFilter,
  type ProjectType,
  type Status,
} from "@/lib/types";

export function ProjectFilters({
  query,
  onQueryChange,
  statusFilter,
  onStatusChange,
  clientFilter,
  onClientChange,
  ownerFilter,
  onOwnerChange,
  typeFilter,
  onTypeChange,
  dateFilter,
  onDateChange,
  clients,
  owners,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: Status | "All";
  onStatusChange: (value: Status | "All") => void;
  clientFilter: string;
  onClientChange: (value: string) => void;
  ownerFilter: string;
  onOwnerChange: (value: string) => void;
  typeFilter: ProjectType | "All";
  onTypeChange: (value: ProjectType | "All") => void;
  dateFilter: DateFilter;
  onDateChange: (value: DateFilter) => void;
  clients: string[];
  owners: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search projects, clients, owners, or types..."
          className="pl-8"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            if (value) onStatusChange(value as Status | "All");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={clientFilter}
          onValueChange={(value) => {
            if (value) onClientChange(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client} value={client}>
                {client}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={ownerFilter}
          onValueChange={(value) => {
            if (value) onOwnerChange(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All owners</SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(value) => {
            if (value) onTypeChange(value as ProjectType | "All");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All types</SelectItem>
            {PROJECT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={dateFilter}
          onValueChange={(value) => {
            if (value) onDateChange(value as DateFilter);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_FILTERS.map((filter) => (
              <SelectItem key={filter} value={filter}>
                {filter === "All" ? "All dates" : filter}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
