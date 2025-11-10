"use client";
import { Badge } from "@/components/ui/badge";
import { frappeBrowser } from "@/lib/frappe";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface StatusToggleBadgeProps {
  doctype?: string;
  docname: string;
  label?: string;
  isActive: boolean;
  remoteToggle?: (next: boolean) => Promise<void>;
  onStatusChange?: (next: boolean) => void;
  disabled?: boolean;
  testId?: string;
}

export function StatusToggleBadge({
  doctype = "Component",
  docname,
  label,
  isActive,
  remoteToggle,
  onStatusChange,
  disabled,
  testId,
}: StatusToggleBadgeProps) {
  const { toast } = useToast();
  const [localActive, setLocalActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading || disabled) return;
    const next = !localActive;
    setLocalActive(next);
    setLoading(true);
    try {
        if (remoteToggle) {
          await remoteToggle(next);
        } else {
          await frappeBrowser.db().updateDoc(doctype, docname, {
            dont_show_in_website: !next,
          });
        }
        onStatusChange?.(next);
        toast({
          title: "Status updated",
          description: `${label || docname} is now ${next ? "Active" : "Inactive"}.`,
        });
    } catch (e: any) {
        setLocalActive(!next);
        toast({
          title: "Failed to update status",
          description: e?.message || "Please try again.",
          variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Badge
      role="button"
      aria-pressed={localActive}
      onClick={handleToggle}
      variant={localActive ? "default" : "secondary"}
      className={`cursor-pointer select-none ${localActive ? "bg-chart-3" : ""} ${disabled ? "opacity-50" : ""}`}
      data-testid={testId}
      title={loading ? "Updating..." : `Click to set ${localActive ? "Inactive" : "Active"}`}
    >
      {loading ? "Updating..." : localActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export default StatusToggleBadge;