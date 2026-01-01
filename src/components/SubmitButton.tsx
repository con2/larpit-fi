"use client";

import { useCallback, type ReactNode } from "react";
import { Button, ButtonProps } from "react-bootstrap";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
  name?: string;
  value?: string;
  confirmationMessage?: string;
  variant?: ButtonProps["variant"];
}

export default function SubmitButton({
  children,
  disabled,
  name,
  value,
  className = "btn btn-primary",
  variant = "primary",
  confirmationMessage,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const onClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (confirmationMessage && !confirm(confirmationMessage)) {
        event.preventDefault();
      }
    },
    [confirmationMessage]
  );

  return (
    <Button
      type="submit"
      variant={variant}
      name={name}
      value={value}
      className={className}
      disabled={disabled || pending}
      onClick={confirmationMessage ? onClick : undefined}
    >
      {children}
    </Button>
  );
}
