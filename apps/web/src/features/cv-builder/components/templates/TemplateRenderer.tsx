import React, { useRef, useState } from "react";
import type { ParsedCVData, TemplateDesign } from "../../types";
import { ClassicTemplate } from "./ClassicTemplate";
import { ModernTemplate } from "./ModernTemplate";
import { MinimalistTemplate } from "./MinimalistTemplate";
import { Printer, SplitSquareVertical } from "lucide-react";

interface Props {
  data: ParsedCVData;
  design: TemplateDesign;
  onChange?: (data: ParsedCVData) => void;
}

export function TemplateRenderer({ data, design, onChange }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [showGuides, setShowGuides] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center w-full min-h-full py-8 px-4 print:p-0">
      <div className="flex gap-4 mb-8 sticky top-4 z-20 bg-white/10 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-white/20 print:hidden">
        <button
          onClick={() => setShowGuides(!showGuides)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            showGuides 
              ? "bg-red-50 text-red-600 border border-red-200" 
              : "bg-white/50 text-gray-700 border border-gray-200 hover:bg-white"
          }`}
        >
          <SplitSquareVertical size={18} /> {showGuides ? "Hide Page Breaks" : "Show Page Breaks"}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
        >
          <Printer size={18} /> Print / Export PDF
        </button>
      </div>

      <div 
        ref={printRef}
        className="relative min-h-[29.7cm] print:min-h-0 print:m-0 print:p-0 print:shadow-none print:w-full w-full max-w-[21cm] print:max-w-none bg-white rounded-lg shadow-2xl overflow-hidden print:overflow-visible transition-all"
      >
        {showGuides && (
          <div className="absolute inset-0 pointer-events-none z-50 print:hidden">
            {[1, 2, 3, 4, 5].map((page) => (
              <div 
                key={page} 
                className="absolute left-0 w-full border-t-2 border-dashed border-red-500 flex justify-end pr-4"
                style={{ top: `${page * 29.7}cm` }}
              >
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-b-md uppercase tracking-wider shadow-sm">
                  End of Page {page} (A4)
                </span>
              </div>
            ))}
          </div>
        )}
        <style>{`
          @media print {
            @page { margin: 0; size: auto; }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              background: white !important;
            }
          }
        `}</style>
        <div className="w-full h-auto text-black print:min-h-0 print:overflow-visible">
          {design === "classic" && <ClassicTemplate data={data} onChange={onChange} />}
          {design === "modern" && <ModernTemplate data={data} onChange={onChange} />}
          {design === "minimalist" && <MinimalistTemplate data={data} onChange={onChange} />}
        </div>
      </div>
    </div>
  );
}
