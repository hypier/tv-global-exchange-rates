"use client";

import { useApiKey } from "@/contexts/ApiKeyContext";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
 import { Fragment, useState } from "react";
import { X, Check, AlertCircle, Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const { apiKey, setApiKey, validateAndSetKey, isValidating } = useApiKey();

  if (!isOpen) return null;

  return (
    <SettingsModalContent apiKey={apiKey} setApiKey={setApiKey} validateAndSetKey={validateAndSetKey} isValidating={isValidating} onClose={onClose} />
  );
}

interface SettingsModalContentProps {
  apiKey: string | null;
  setApiKey: (apiKey: string | null) => void;
  validateAndSetKey: (apiKey: string) => Promise<boolean>;
  isValidating: boolean;
  onClose: () => void;
}

function SettingsModalContent({
  apiKey,
  setApiKey,
  validateAndSetKey,
  isValidating,
  onClose,
}: SettingsModalContentProps) {
  const [inputValue, setInputValue] = useState(apiKey || "");
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error" | "validating">("idle");

  const handleTest = async () => {
    setTestStatus("validating");
    const isValid = await validateAndSetKey(inputValue);
    setTestStatus(isValid ? "success" : "error");
  };

  const handleSave = () => {
    if (inputValue !== apiKey) {
      setApiKey(inputValue);
    }
    onClose();
  };

  const handleRemove = () => {
    setApiKey(null);
    setInputValue("");
    setTestStatus("idle");
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-[#060e20]/80 backdrop-blur-md" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-container-low text-left align-middle shadow-[0_40px_60px_-10px_rgba(0,0,0,0.5)] transition-all border border-white/5">
                <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-surface-container-lowest">
                  <DialogTitle as="h3" className="text-lg font-headline font-black flex items-center gap-2 text-fintech-primary tracking-widest uppercase">
                    <Shield className="w-5 h-5" />
                    RapidAPI Access
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="text-fintech-muted hover:text-fintech-text transition-colors p-1 rounded-full hover:bg-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8">
                  <p className="text-sm text-fintech-muted mb-8 leading-relaxed font-medium tracking-normal normal-case">
                    Paste the <span className="font-mono font-bold text-fintech-primary">x-rapidapi-key</span> value from the RapidAPI tradingview-data1 page. Your key is stored locally in your browser and never leaves your machine.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="api-key" className="block text-[10px] font-black uppercase tracking-[0.2em] text-fintech-muted mb-2">
                        Institutional API Key
                      </label>
                      <input
                        type="password"
                        id="api-key"
                        className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3.5 text-fintech-text placeholder:text-fintech-muted/20 focus:outline-none focus:ring-2 focus:ring-fintech-primary/30 focus:border-fintech-primary/50 transition-all font-mono text-sm"
                        placeholder="Paste your RapidAPI x-rapidapi-key..."
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          setTestStatus("idle");
                        }}
                      />
                    </div>

                    {testStatus !== "idle" && (
                      <div className={cn(
                        "rounded-xl p-4 text-xs flex items-center gap-3 border font-bold uppercase tracking-widest leading-none",
                        testStatus === "validating" ? "bg-surface-container-highest text-fintech-muted border-white/5" :
                        testStatus === "success" ? "bg-fintech-success/10 text-fintech-success border-fintech-success/20 glow-emerald" :
                        "bg-fintech-danger/10 text-fintech-danger border-fintech-danger/20 glow-rose"
                      )}>
                        {testStatus === "validating" && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                        {testStatus === "success" && <Check className="w-4 h-4 shrink-0" />}
                        {testStatus === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>
                          {testStatus === "validating" ? "Validating Feed..." :
                           testStatus === "success" ? "Access Granted" :
                           "Access Denied"}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleTest}
                        disabled={!inputValue || isValidating || testStatus === "validating"}
                        className="flex-1 bg-surface-container-highest hover:bg-surface-container text-fintech-text font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl transition-all border border-white/5 disabled:opacity-30 flex justify-center items-center gap-2"
                      >
                        {testStatus === "validating" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Feed"}
                      </button>
                      
                      <button
                        onClick={handleSave}
                        className="flex-1 bg-fintech-primary hover:opacity-90 text-fintech-primary-container font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-lg"
                      >
                        Save Access
                      </button>
                    </div>

                    <div className="pt-6 border-t border-white/5 mt-6 text-center">
                      <p className="text-[10px] text-fintech-muted uppercase tracking-[0.2em] mb-3">
                        No API key yet? Get your free key on RapidAPI.
                      </p>
                      <a 
                        href="https://rapidapi.com/hypier/api/tradingview-data1" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-fintech-primary hover:text-fintech-primary-light transition-all group"
                      >
                        Get Free API Key
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </a>
                    </div>

                    {apiKey && (
                       <div className="text-center pt-2">
                         <button
                           onClick={handleRemove}
                           className="text-[9px] font-bold uppercase tracking-widest text-fintech-muted/40 hover:text-fintech-danger transition-colors"
                         >
                           Wipe Stored Credentials
                         </button>
                       </div>
                    )}
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
