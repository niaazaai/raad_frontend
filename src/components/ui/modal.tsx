"use client";

import * as React from "react";
import { Xmark } from "iconoir-react";
import { cn } from "@/lib/utils";

interface ModalContextValue {
  open: boolean;
  onClose: () => void;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ open, onClose, children }: ModalProps) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return <ModalContext.Provider value={{ open, onClose }}>{children}</ModalContext.Provider>;
};

interface ModalOverlayProps {
  className?: string;
}

const ModalOverlay = ({ className }: ModalOverlayProps) => {
  const context = React.useContext(ModalContext);
  if (!context?.open) return null;

  return (
    <div
      className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]", className)}
      onClick={context.onClose}
      aria-hidden
    />
  );
};

interface ModalContentProps {
  className?: string;
  children: React.ReactNode;
  showClose?: boolean;
}

const ModalContent = ({ className, children, showClose = true }: ModalContentProps) => {
  const context = React.useContext(ModalContext);
  if (!context?.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={context.onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-visible rounded-xl border border-border bg-card shadow-xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showClose ? (
          <button
            type="button"
            onClick={context.onClose}
            className="absolute end-3 top-3 z-10 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <Xmark className="h-4 w-4" />
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
};

const ModalHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("border-b border-border px-6 py-4 pe-12", className)}>{children}</div>
);

const ModalBody = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("min-h-0 flex-1 overflow-visible px-6 py-4", className)}>{children}</div>
);

const ModalFooter = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("flex items-center justify-end gap-2 border-t border-border px-6 py-4", className)}>
    {children}
  </div>
);

const ModalTitle = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <h2 className={cn("text-lg font-semibold text-foreground", className)}>{children}</h2>
);

const ModalDescription = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <p className={cn("mt-1 text-sm text-muted-foreground", className)}>{children}</p>
);

export {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
};
