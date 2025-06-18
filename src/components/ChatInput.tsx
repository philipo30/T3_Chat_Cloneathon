import React from "react";
import { ArrowUp, ChevronDown, Globe, Paperclip } from "lucide-react";
import { Button } from "./ui/button";

interface ChatInputProps {
  value?: string;
  onInputChange?: (value: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value = "",
  onInputChange,
}) => {
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-10 w-full">
      <div className="flex flex-col mx-auto max-w-3xl relative text-center w-full pointer-events-none">
        <div className="pointer-events-none text-center">
          <div className="mx-auto text-center w-fit">
            <p className="sr-only text-sm text-[rgb(231,208,221)]">
              Upgrade to Pro
            </p>
            <div className="flex justify-center -mb-px mx-3 mt-3 text-center">
              <div className="backdrop-blur-3xl bg-[rgba(31,26,36,0.5)] border border-[rgba(54,45,61,0.4)] rounded-t-md text-[rgba(212,199,225,0.8)] text-sm max-w-[548.73px] px-4 py-4 text-center">
                <span>Make sure you agree to our </span>
                <a
                  href="#"
                  className="inline font-medium underline text-center"
                >
                  Terms
                </a>
                <span> and our </span>
                <a
                  href="#"
                  className="inline font-medium underline text-center"
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="backdrop-blur-4xl bg-[rgba(51,46,56,0.4)] rounded-t-5xl px-2 pt-2 relative text-center flex rounded-t-[24px]">
              <form className="relative flex flex-col items-stretch bg-[rgba(54,45,61,0.043)] border border-[rgba(212,212,212,0.04)] border-b-0 rounded-t-3xl shadow-[0_80px_50px_0_rgba(0,0,0,0.1),0_50px_30px_0_rgba(0,0,0,0.07),0_30px_15px_0_rgba(0,0,0,0.06),0_15px_8px_0_rgba(0,0,0,0.04),0_6px_4px_0_rgba(0,0,0,0.04),0_2px_2px_0_rgba(0,0,0,0.02)] text-[rgb(212,199,225)] gap-2 max-w-3xl outline outline-8 outline-[rgba(31,26,36,0.4)] px-3 py-3 w-full text-center pointer-events-auto">
                <div className="flex-1 flex flex-col text-center">
                  <div className="text-center"></div>
                  <div className="flex flex-1 items-start text-center">
                    <textarea
                      name="input"
                      placeholder="Type your message here..."
                      aria-label="Message input"
                      autoComplete="off"
                      value={value}
                      onChange={(e) => onInputChange?.(e.target.value)}
                      className="w-full h-12 bg-transparent border-0 text-white placeholder:text-[rgb(212,199,225)] resize-none outline-none focus:ring-0 text-sm whitespace-pre-wrap break-words"
                    />
                    <div className="sr-only">
                      Press Enter to send, Shift + Enter for new line
                    </div>
                  </div>
                  <div className="flex flex-row-reverse justify-between -mb-px mt-2 w-full text-center">
                    <div
                      aria-label="Message actions"
                      className="flex items-center justify-center gap-2 -mr-0.5 -mt-0.5 bg-transparent text-center"
                    >
                      <Button
                        type="submit"
                        aria-label="Send message"
                        className="w-9 h-9 bg-[rgba(163,0,76,0.2)] hover:bg-[rgba(163,0,76,0.3)] text-[rgb(253,242,248)] font-semibold border border-[rgb(39,36,44)] rounded-lg shadow-sm transition-colors duration-150 p-2"
                      >
                        <ArrowUp className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 pr-2 text-center">
                      <div className="flex items-center gap-1 -ml-2 text-center">
                        <Button
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded="false"
                          className="flex items-center justify-center gap-2 h-8 bg-transparent border-0 text-[rgb(231,208,221)] font-medium text-xs rounded-md transition-colors duration-150 px-2 py-1.5 -mb-2 hover:bg-transparent"
                        >
                          <div className="text-[rgb(231,208,221)] text-sm font-medium text-left whitespace-nowrap">
                            Gemini 2.5 Flash
                          </div>
                          <ChevronDown className="w-6 h-6 text-[rgb(231,208,221)] right-0" />
                        </Button>
                        <Button
                          aria-label="Web search not available on free plan"
                          type="button"
                          className="flex items-center justify-center gap-2 bg-transparent border border-[rgba(212,199,225,0.1)] text-[rgb(231,208,221)] font-medium text-xs rounded-full transition-colors duration-150 px-2 py-1.5 -mb-1.5 hover:bg-transparent"
                        >
                          <Globe className="w-6 h-6 text-[rgb(231,208,221)]" />
                          <span className="text-xs font-medium text-center whitespace-nowrap">
                            Search
                          </span>
                        </Button>
                        <Button
                          aria-label="Attaching files is a subscriber-only feature"
                          type="button"
                          className="flex items-center justify-center gap-2 bg-transparent border border-[rgba(212,199,225,0.1)] text-[rgb(231,208,221)] font-medium text-xs rounded-full transition-colors duration-150 px-2 py-2.5 -mb-1.5 hover:bg-transparent"
                        >
                          <Paperclip className="w-6 h-6 text-[rgb(231,208,221)]" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
