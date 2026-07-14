import React, { useState } from "react";
import type { TemplateDesign, ParsedCVData } from "../types";
import { CvControls } from "./CvControls";
import { TemplateRenderer } from "./templates/TemplateRenderer";
import { Sparkles } from "lucide-react";

export function CvBuilderLayout() {
  const [design, setDesign] = useState<TemplateDesign>("classic");
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null);
  const [meta, setMeta] = useState<any>(null);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] print:h-auto bg-muted/20 print:bg-white overflow-hidden print:overflow-visible font-sans print:m-0 print:p-0">
      <div className="relative flex w-full h-full print:h-auto p-4 print:p-0 gap-6 print:gap-0 print:m-0">
        {/* Left Sidebar - AI Controls */}
        <div className="w-[450px] min-w-[450px] flex-shrink-0 h-full z-10 print:hidden flex flex-col">
          <div className="flex-1 rounded-xl bg-card text-card-foreground border shadow-sm overflow-hidden flex flex-col">
            <CvControls
              design={design}
              setDesign={setDesign}
              parsedData={parsedData}
              setParsedData={setParsedData}
              meta={meta}
              setMeta={setMeta}
            />
          </div>
        </div>

        {/* Right Pane - Preview Workspace */}
        <div className="flex-1 h-full overflow-y-auto rounded-xl bg-card border shadow-sm print:m-0 print:p-0 print:bg-white print:border-none print:shadow-none print:rounded-none custom-scrollbar">
          {parsedData ? (
            <TemplateRenderer data={parsedData} design={design} onChange={setParsedData} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground print:hidden">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <div className="relative bg-primary/10 p-6 rounded-2xl border border-primary/20">
                  <Sparkles size={48} className="text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-medium text-foreground mb-3">AI CV Optimizer</h3>
              <p className="text-sm text-muted-foreground max-w-sm text-center leading-relaxed">
                Upload your existing CV or paste a job description. Our AI will automatically rewrite, format, and optimize your resume for ATS systems.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
