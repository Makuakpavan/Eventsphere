"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ButtonLoader } from "@/components/ui/button-loader";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingText?: string;
};

export function PendingSubmitButton({
  children,
  pendingText = "Saving...",
  className = "",
  disabled,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={`${className} disabled:cursor-wait disabled:opacity-60`}
    >
      {pending && <ButtonLoader />}
      {pending ? pendingText : children}
    </button>
  );
}
