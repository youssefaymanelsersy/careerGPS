import React, { useRef } from "react";
import type { ParsedCVData, TemplateDesign } from "../../types";
import { ClassicTemplate } from "./ClassicTemplate";
import { ModernTemplate } from "./ModernTemplate";
import { MinimalistTemplate } from "./MinimalistTemplate";
import { Download, Printer } from "lucide-react";

interface Props {
  data: ParsedCVData;
  design: TemplateDesign;
}

export function TemplateRenderer({ data, design }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen py-8">
      <div className="flex gap-4 mb-6 sticky top-4 z-10 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-sm border border-gray-200">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      <div 
        ref={printRef}
        className="print:m-0 print:p-0 print:shadow-none print:w-full w-full max-w-4xl overflow-hidden shadow-2xl bg-white"
      >
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
        <div className="print-area w-full h-full">
          {design === "classic" && <ClassicTemplate data={data} />}
          {design === "modern" && <ModernTemplate data={data} />}
          {design === "minimalist" && <MinimalistTemplate data={data} />}
        </div>
      </div>
    </div>
  );
}
