import React from "react";
import type { ParsedCVData } from "../../types";
import { MapPin, Mail, Phone, Globe, Link, Plus, Trash2, ArrowUp, ArrowDown, ChevronsDown, ChevronsUp } from "lucide-react";
import { formatUrl } from "../../utils/formatUrl";

interface Props {
  data: ParsedCVData;
  onChange?: (data: ParsedCVData) => void;
}

export function ClassicTemplate({ data, onChange }: Props) {
  const isEditable = !!onChange;

  const updateField = (field: keyof ParsedCVData, value: any) => {
    if (!onChange) return;
    onChange({ ...data, [field]: value });
  };

  const updateLink = (field: keyof ParsedCVData["links"], value: string | null) => {
    if (!onChange) return;
    onChange({ ...data, links: { ...data.links, [field]: value } });
  };

  const updateArray = (arrayName: keyof ParsedCVData, index: number, field: string, value: any) => {
    if (!onChange) return;
    const arr = [...(data[arrayName] as any[])];
    arr[index] = { ...arr[index], [field]: value };
    onChange({ ...data, [arrayName]: arr });
  };

  const deleteArrayItem = (arrayName: keyof ParsedCVData, index: number) => {
    if (!onChange) return;
    const arr = [...(data[arrayName] as any[])];
    arr.splice(index, 1);
    onChange({ ...data, [arrayName]: arr });
  };

  const moveArrayItem = (arrayName: keyof ParsedCVData, index: number, direction: 1 | -1) => {
    if (!onChange) return;
    const arr = [...(data[arrayName] as any[])];
    if (index + direction < 0 || index + direction >= arr.length) return;
    const temp = arr[index];
    arr[index] = arr[index + direction];
    arr[index + direction] = temp;
    onChange({ ...data, [arrayName]: arr });
  };

  const addArrayItem = (arrayName: keyof ParsedCVData, defaultItem: any) => {
    if (!onChange) return;
    const arr = [...(data[arrayName] as any[])];
    arr.push(defaultItem);
    onChange({ ...data, [arrayName]: arr });
  };

  const getSpacing = (key: string) => data.spacing?.[key] || 0;
  const updateSpacing = (key: string, delta: number) => {
    if (!onChange) return;
    const current = getSpacing(key);
    const newSpacing = Math.max(0, current + delta);
    onChange({ ...data, spacing: { ...(data.spacing || {}), [key]: newSpacing } });
  };

  const editableProps = (field: string, onUpdate: (val: string) => void) => {
    if (!isEditable) return {};
    return {
      contentEditable: true,
      suppressContentEditableWarning: true,
      onBlur: (e: React.FocusEvent<HTMLElement>) => onUpdate(e.currentTarget.textContent || ""),
      className: "hover:bg-blue-50 focus:bg-blue-50 outline-none rounded px-1 -mx-1 border border-transparent hover:border-blue-200 focus:border-blue-400 transition-colors cursor-text min-w-[20px] print:hover:bg-transparent print:border-transparent print:p-0 print:m-0",
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-10 min-h-[1056px] print:min-h-0 shadow-lg print:shadow-none text-sm font-serif group/template">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-4 text-center">
        <h1 
          className="text-4xl font-bold uppercase tracking-wider mb-2"
          {...editableProps("fullName", (v) => updateField("fullName", v))}
        >
          {data.fullName || "Your Name"}
        </h1>
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-gray-700">
          <span className="flex items-center gap-1">
            <Mail size={14} /> 
            <span {...editableProps("email", (v) => updateField("email", v))}>
              {data.email || "Email"}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Phone size={14} /> 
            <span {...editableProps("phone", (v) => updateField("phone", v))}>
              {data.phone || "Phone"}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={14} /> 
            <span {...editableProps("location", (v) => updateField("location", v))}>
              {data.location || "Location"}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-4 mt-2 text-gray-700">
          <span className="flex items-center gap-1 text-blue-600">
            <Link size={14} />
            <span {...editableProps("linkedin", (v) => updateLink("linkedin", v))}>
              {data.links?.linkedin || "LinkedIn URL"}
            </span>
          </span>
          <span className="flex items-center gap-1 text-gray-900">
            <Link size={14} />
            <span {...editableProps("github", (v) => updateLink("github", v))}>
              {data.links?.github || "GitHub URL"}
            </span>
          </span>
          <span className="flex items-center gap-1 text-blue-600">
            <Globe size={14} />
            <span {...editableProps("portfolio", (v) => updateLink("portfolio", v))}>
              {data.links?.portfolio || "Portfolio URL"}
            </span>
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 relative group/section">
        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-2 pb-1">
          Professional Summary
        </h2>
        <p 
          className="text-gray-800 leading-relaxed text-justify"
          {...editableProps("summary", (v) => updateField("summary", v))}
        >
          {data.summary || "Write your professional summary here..."}
        </p>
      </div>

      {/* Experience */}
      <div 
        className="mb-6 relative group/section"
        style={{ marginTop: `${getSpacing('section-experience')}rem` }}
      >
        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">
          Experience
        </h2>
        {isEditable && (
          <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
            <button onClick={() => updateSpacing('section-experience', 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Section Down"><ChevronsDown size={14} /></button>
            <button onClick={() => updateSpacing('section-experience', -1)} disabled={getSpacing('section-experience') === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30" title="Pull Section Up"><ChevronsUp size={14} /></button>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {data.experience?.map((exp, idx) => (
            <div 
              key={idx} 
              className="relative group/item"
              style={{ marginTop: `${getSpacing(`experience-${idx}`)}rem` }}
            >
              <div className="flex justify-between items-baseline mb-1">
                <h3 
                  className="font-bold text-base"
                  {...editableProps("title", (v) => updateArray("experience", idx, "title", v))}
                >
                  {exp.title || "Job Title"}
                </h3>
                <span className="text-gray-600 italic flex gap-1">
                  <span {...editableProps("startDate", (v) => updateArray("experience", idx, "startDate", v))}>
                    {exp.startDate || "Start"}
                  </span>
                  - 
                  <span {...editableProps("endDate", (v) => updateArray("experience", idx, "endDate", v))}>
                    {exp.endDate || "Present"}
                  </span>
                </span>
              </div>
              <div 
                className="font-semibold text-gray-700 mb-1"
                {...editableProps("company", (v) => updateArray("experience", idx, "company", v))}
              >
                {exp.company || "Company Name"}
              </div>
              <p 
                className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                {...editableProps("description", (v) => updateArray("experience", idx, "description", v))}
              >
                {exp.description || "Job description..."}
              </p>
              
              {isEditable && (
                <div className="absolute -right-8 top-1 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden">
                  <button onClick={() => updateSpacing(`experience-${idx}`, 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Item Down"><ChevronsDown size={14} /></button>
                  <button onClick={() => updateSpacing(`experience-${idx}`, -1)} disabled={getSpacing(`experience-${idx}`) === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronsUp size={14} /></button>
                  <button 
                    onClick={() => moveArrayItem("experience", idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    onClick={() => moveArrayItem("experience", idx, 1)}
                    disabled={idx === (data.experience?.length || 0) - 1}
                    className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button 
                    onClick={() => deleteArrayItem("experience", idx)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {isEditable && (
            <button 
              onClick={() => addArrayItem("experience", { title: "New Job", company: "Company", description: "Description", startDate: "2023", endDate: "Present" })}
              className="mt-2 py-2 w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 rounded-lg flex items-center justify-center gap-2 transition-colors print:hidden"
            >
              <Plus size={16} /> Add Experience
            </button>
          )}
        </div>
      </div>

      {/* Projects */}
      <div 
        className="mb-6 relative group/section"
        style={{ marginTop: `${getSpacing('section-projects')}rem` }}
      >
        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">
          Projects
        </h2>
        {isEditable && (
          <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
            <button onClick={() => updateSpacing('section-projects', 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Section Down"><ChevronsDown size={14} /></button>
            <button onClick={() => updateSpacing('section-projects', -1)} disabled={getSpacing('section-projects') === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30" title="Pull Section Up"><ChevronsUp size={14} /></button>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {data.projects?.map((proj, idx) => (
            <div 
              key={idx} 
              className="relative group/item"
              style={{ marginTop: `${getSpacing(`projects-${idx}`)}rem` }}
            >
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold text-base flex gap-2 items-center flex-wrap">
                  <span {...editableProps("name", (v) => updateArray("projects", idx, "name", v))}>
                    {proj.name || "Project Name"}
                  </span>
                  <span className="text-blue-600 font-normal text-xs" {...editableProps("url", (v) => updateArray("projects", idx, "url", v))}>
                    {proj.url || "Project URL"}
                  </span>
                </h3>
                <span className="text-gray-600 italic flex gap-1">
                  <span {...editableProps("startDate", (v) => updateArray("projects", idx, "startDate", v))}>
                    {proj.startDate || "Start"}
                  </span>
                  - 
                  <span {...editableProps("endDate", (v) => updateArray("projects", idx, "endDate", v))}>
                    {proj.endDate || "Present"}
                  </span>
                </span>
              </div>
              <p 
                className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                {...editableProps("description", (v) => updateArray("projects", idx, "description", v))}
              >
                {proj.description || "Project description..."}
              </p>
              
              {isEditable && (
                <div className="absolute -right-8 top-1 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden">
                  <button onClick={() => updateSpacing(`projects-${idx}`, 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Item Down"><ChevronsDown size={14} /></button>
                  <button onClick={() => updateSpacing(`projects-${idx}`, -1)} disabled={getSpacing(`projects-${idx}`) === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronsUp size={14} /></button>
                  <button 
                    onClick={() => moveArrayItem("projects", idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    onClick={() => moveArrayItem("projects", idx, 1)}
                    disabled={idx === (data.projects?.length || 0) - 1}
                    className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button 
                    onClick={() => deleteArrayItem("projects", idx)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {isEditable && (
            <button 
              onClick={() => addArrayItem("projects", { name: "New Project", description: "Description", technologies: [] })}
              className="mt-2 py-2 w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 rounded-lg flex items-center justify-center gap-2 transition-colors print:hidden"
            >
              <Plus size={16} /> Add Project
            </button>
          )}
        </div>
      </div>

      {/* Education & Certifications (Two Columns) */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div 
          className="relative group/section"
          style={{ marginTop: `${getSpacing('section-education')}rem` }}
        >
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">
            Education
          </h2>
          {isEditable && (
            <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
              <button onClick={() => updateSpacing('section-education', 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Section Down"><ChevronsDown size={14} /></button>
              <button onClick={() => updateSpacing('section-education', -1)} disabled={getSpacing('section-education') === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30" title="Pull Section Up"><ChevronsUp size={14} /></button>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {data.education?.map((edu, idx) => (
              <div 
                key={idx} 
                className="relative group/item"
                style={{ marginTop: `${getSpacing(`education-${idx}`)}rem` }}
              >
                <div 
                  className="font-bold"
                  {...editableProps("institution", (v) => updateArray("education", idx, "institution", v))}
                >
                  {edu.institution || "University"}
                </div>
                <div className="text-gray-800 flex gap-1">
                  <span {...editableProps("degree", (v) => updateArray("education", idx, "degree", v))}>
                    {edu.degree || "Degree"}
                  </span>
                  in 
                  <span {...editableProps("major", (v) => updateArray("education", idx, "major", v))}>
                    {edu.major || "Major"}
                  </span>
                </div>
                <div className="text-gray-600 italic text-xs flex gap-1">
                  <span {...editableProps("startDate", (v) => updateArray("education", idx, "startDate", v))}>
                    {edu.startDate || "Start"}
                  </span>
                  - 
                  <span {...editableProps("endDate", (v) => updateArray("education", idx, "endDate", v))}>
                    {edu.endDate || "Present"}
                  </span>
                </div>

                {isEditable && (
                  <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden">
                    <button onClick={() => updateSpacing(`education-${idx}`, 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Item Down"><ChevronsDown size={14} /></button>
                    <button onClick={() => updateSpacing(`education-${idx}`, -1)} disabled={getSpacing(`education-${idx}`) === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronsUp size={14} /></button>
                    <button 
                      onClick={() => moveArrayItem("education", idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => moveArrayItem("education", idx, 1)}
                      disabled={idx === (data.education?.length || 0) - 1}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button 
                      onClick={() => deleteArrayItem("education", idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isEditable && (
              <button 
                onClick={() => addArrayItem("education", { institution: "University", degree: "Degree", major: "Major" })}
                className="mt-2 py-1.5 w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 rounded flex items-center justify-center gap-1 transition-colors print:hidden text-xs"
              >
                <Plus size={14} /> Add Education
              </button>
            )}
          </div>
        </div>

        <div 
          className="relative group/section"
          style={{ marginTop: `${getSpacing('section-certifications')}rem` }}
        >
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">
            Certifications
          </h2>
          {isEditable && (
            <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
              <button onClick={() => updateSpacing('section-certifications', 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Section Down"><ChevronsDown size={14} /></button>
              <button onClick={() => updateSpacing('section-certifications', -1)} disabled={getSpacing('section-certifications') === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30" title="Pull Section Up"><ChevronsUp size={14} /></button>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {data.certifications?.map((cert, idx) => (
              <div 
                key={idx} 
                className="relative group/item"
                style={{ marginTop: `${getSpacing(`certifications-${idx}`)}rem` }}
              >
                <div 
                  className="font-bold"
                  {...editableProps("name", (v) => updateArray("certifications", idx, "name", v))}
                >
                  {cert.name || "Certification Name"}
                </div>
                <div 
                  className="text-gray-800"
                  {...editableProps("issuer", (v) => updateArray("certifications", idx, "issuer", v))}
                >
                  {cert.issuer || "Issuer"}
                </div>
                <div 
                  className="text-gray-600 italic text-xs"
                  {...editableProps("date", (v) => updateArray("certifications", idx, "date", v))}
                >
                  {cert.date || "Date"}
                </div>

                {isEditable && (
                  <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden">
                    <button onClick={() => updateSpacing(`certifications-${idx}`, 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Item Down"><ChevronsDown size={14} /></button>
                    <button onClick={() => updateSpacing(`certifications-${idx}`, -1)} disabled={getSpacing(`certifications-${idx}`) === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronsUp size={14} /></button>
                    <button 
                      onClick={() => moveArrayItem("certifications", idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => moveArrayItem("certifications", idx, 1)}
                      disabled={idx === (data.certifications?.length || 0) - 1}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button 
                      onClick={() => deleteArrayItem("certifications", idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isEditable && (
              <button 
                onClick={() => addArrayItem("certifications", { name: "Certificate", issuer: "Issuer" })}
                className="mt-2 py-1.5 w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 rounded flex items-center justify-center gap-1 transition-colors print:hidden text-xs"
              >
                <Plus size={14} /> Add Certification
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="relative group/section">
        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">
          Skills
        </h2>
        
        {data.skills?.technical && data.skills.technical.length > 0 && (
          <div className="mb-2">
            <span className="font-bold mr-2">Technical:</span>
            <span 
              className="text-gray-800"
              {...editableProps("technicalSkills", (v) => {
                if (!onChange) return;
                onChange({
                  ...data,
                  skills: {
                    ...data.skills,
                    technical: v.split(",").map(s => ({ name: s.trim(), level: "Intermediate" }))
                  }
                });
              })}
            >
              {data.skills.technical.map((s) => s.name).join(", ")}
            </span>
          </div>
        )}

        {data.skills?.nonTechnical && data.skills.nonTechnical.length > 0 && (
          <div>
            <span className="font-bold mr-2">Soft Skills:</span>
            <span 
              className="text-gray-800"
              {...editableProps("softSkills", (v) => {
                if (!onChange) return;
                onChange({
                  ...data,
                  skills: {
                    ...data.skills,
                    nonTechnical: v.split(",").map(s => ({ name: s.trim(), level: "Intermediate" }))
                  }
                });
              })}
            >
              {data.skills.nonTechnical.map((s) => s.name).join(", ")}
            </span>
          </div>
        )}

        {data.languages && data.languages.length > 0 && (
          <div className="mt-2">
            <span className="font-bold mr-2">Languages:</span>
            <span 
              className="text-gray-800"
              {...editableProps("languages", (v) => {
                if (!onChange) return;
                onChange({ ...data, languages: v.split(",").map(s => s.trim()) });
              })}
            >
              {data.languages.join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
