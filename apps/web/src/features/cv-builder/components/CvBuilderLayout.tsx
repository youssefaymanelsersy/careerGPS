import React, { useState } from "react";
import type { TemplateDesign, ParsedCVData } from "../types";
import { CvControls } from "./CvControls";
import { TemplateRenderer } from "./templates/TemplateRenderer";
import { FileText } from "lucide-react";

export function CvBuilderLayout() {
  const [design, setDesign] = useState<TemplateDesign>("classic");
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null);
  const [meta, setMeta] = useState<any>(null);

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-gray-50 overflow-hidden font-sans border rounded-lg">
      {/* Left Sidebar - Controls */}
      <div className="w-[450px] min-w-[450px] flex-shrink-0 bg-white h-full shadow-lg z-10 print:hidden">
        <CvControls
          design={design}
          setDesign={setDesign}
          parsedData={parsedData}
          setParsedData={setParsedData}
          meta={meta}
          setMeta={setMeta}
        />
      </div>

      {/* Right Pane - Preview */}
      <div className="flex-1 h-full overflow-y-auto print:overflow-visible print:w-full print:h-auto">
        {parsedData ? (
          <TemplateRenderer data={parsedData} design={design} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 print:hidden">
            <FileText size={64} className="mb-4 opacity-20" />
            <h3 className="text-xl font-medium text-gray-500 mb-2">Live Preview</h3>
            <p className="text-sm max-w-sm text-center">
              Upload your CV and select a template to see how it looks. Your optimized resume will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
