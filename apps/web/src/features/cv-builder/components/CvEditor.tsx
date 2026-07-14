import React from "react";
import type { ParsedCVData, Experience, Project } from "../types";

interface Props {
  data: ParsedCVData;
  onChange: (newData: ParsedCVData) => void;
}

export function CvEditor({ data, onChange }: Props) {
  const handleChange = (field: keyof ParsedCVData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleNestedChange = (field: keyof ParsedCVData, index: number, subField: string, value: any) => {
    const newArray = [...(data[field] as any[])];
    newArray[index] = { ...newArray[index], [subField]: value };
    onChange({ ...data, [field]: newArray });
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Edit Details</h3>
      
      {/* Basic Info */}
      <div className="flex flex-col gap-3">
        <h4 className="font-medium text-gray-700">Basic Info</h4>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Full Name</label>
          <input 
            type="text" 
            value={data.fullName || ""} 
            onChange={(e) => handleChange("fullName", e.target.value)}
            className="w-full border rounded-md p-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input 
              type="email" 
              value={data.email || ""} 
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input 
              type="text" 
              value={data.phone || ""} 
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Professional Summary</label>
          <textarea 
            rows={4}
            value={data.summary || ""} 
            onChange={(e) => handleChange("summary", e.target.value)}
            className="w-full border rounded-md p-2 text-sm"
          />
        </div>
      </div>

      {/* Experience */}
      {data.experience?.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="font-medium text-gray-700">Experience</h4>
          {data.experience.map((exp: Experience, idx: number) => (
            <div key={idx} className="p-3 border rounded-lg bg-gray-50">
              <div className="font-semibold text-sm mb-2">{exp.company} - {exp.title}</div>
              <textarea 
                rows={3}
                value={exp.description || ""} 
                onChange={(e) => handleNestedChange("experience", idx, "description", e.target.value)}
                className="w-full border rounded-md p-2 text-sm"
                placeholder="Job description..."
              />
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {data.projects?.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="font-medium text-gray-700">Projects</h4>
          {data.projects.map((proj: Project, idx: number) => (
            <div key={idx} className="p-3 border rounded-lg bg-gray-50">
              <div className="font-semibold text-sm mb-2">{proj.name}</div>
              <textarea 
                rows={3}
                value={proj.description || ""} 
                onChange={(e) => handleNestedChange("projects", idx, "description", e.target.value)}
                className="w-full border rounded-md p-2 text-sm"
                placeholder="Project description..."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
