"use client";

import type { ComponentProps } from "react";
import { trackGenerateLead, type LeadType } from "@/lib/analytics";

type TrackedLinkProps = ComponentProps<"a"> & {
  leadType: LeadType;
  location: string;
};

export function TrackedLink({ leadType, location, onClick, ...props }: TrackedLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackGenerateLead(leadType, location);
        onClick?.(event);
      }}
    />
  );
}
