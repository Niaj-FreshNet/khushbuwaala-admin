'use client';

/**
 * App-styled replacements for window.confirm / window.prompt (A-20).
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Delete this review?', danger: true }))) return;
 *
 *   const ask = usePrompt();
 *   const value = await ask({ title: 'Correct net profit', inputType: 'number', defaultValue: '120' }); // null = cancelled
 *
 * Mounted once in DashboardShell. Big buttons, works on phones, Esc / outside tap = cancel.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};
type PromptOptions = ConfirmOptions & {
  label?: string;
  defaultValue?: string;
  inputType?: 'text' | 'number';
  placeholder?: string;
};

type Request =
  | { kind: 'confirm'; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'prompt'; opts: PromptOptions; resolve: (v: string | null) => void };

const Ctx = createContext<{ open: (r: Request) => void } | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<Request | null>(null);
  const [value, setValue] = useState('');
  const settled = useRef(false);

  const open = useCallback((r: Request) => {
    settled.current = false;
    if (r.kind === 'prompt') setValue(r.opts.defaultValue ?? '');
    setReq(r);
  }, []);

  const finish = (ok: boolean) => {
    if (!req || settled.current) return;
    settled.current = true;
    if (req.kind === 'confirm') req.resolve(ok);
    else req.resolve(ok ? value : null);
    setReq(null);
  };

  const o = req?.opts;
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <AlertDialog open={!!req} onOpenChange={(v) => { if (!v) finish(false); }}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-xl p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              finish(true);
            }}
            className="space-y-4"
          >
            <AlertDialogHeader className="text-left">
              <AlertDialogTitle className="text-base">{o?.title}</AlertDialogTitle>
              {o?.description && <AlertDialogDescription>{o.description}</AlertDialogDescription>}
            </AlertDialogHeader>
            {req?.kind === 'prompt' && (
              <label className="block space-y-1">
                {req.opts.label && <span className="text-xs font-semibold text-gray-700">{req.opts.label}</span>}
                <Input
                  autoFocus
                  type={req.opts.inputType || 'text'}
                  inputMode={req.opts.inputType === 'number' ? 'decimal' : undefined}
                  step={req.opts.inputType === 'number' ? 'any' : undefined}
                  value={value}
                  placeholder={req.opts.placeholder}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-10"
                />
              </label>
            )}
            <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <AlertDialogCancel type="button" className="h-10 sm:h-9">{o?.cancelText || 'Cancel'}</AlertDialogCancel>
              <Button
                type="submit"
                autoFocus={req?.kind === 'confirm'}
                className={o?.danger ? 'h-10 sm:h-9 bg-rose-600 text-white hover:bg-rose-700' : 'h-10 sm:h-9'}
              >
                {o?.confirmText || (o?.danger ? 'Delete' : 'OK')}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </Ctx.Provider>
  );
}

const useCtx = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useConfirm/usePrompt must be used inside <ConfirmProvider>');
  return c;
};

export function useConfirm() {
  const { open } = useCtx();
  return useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => open({ kind: 'confirm', opts, resolve })), [open]);
}

export function usePrompt() {
  const { open } = useCtx();
  return useCallback((opts: PromptOptions) => new Promise<string | null>((resolve) => open({ kind: 'prompt', opts, resolve })), [open]);
}
