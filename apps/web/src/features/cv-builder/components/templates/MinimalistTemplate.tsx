import React from "react";
import type { ParsedCVData } from "../../types";
import { formatUrl } from "../../utils/formatUrl";
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronsDown, ChevronsUp } from "lucide-react";

interface Props {
  data: ParsedCVData;
  onChange?: (data: ParsedCVData) => void;
}

export function MinimalistTemplate({ data, onChange }: Props) {
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
      className: "hover:bg-gray-100 focus:bg-gray-100 outline-none rounded px-1 -mx-1 border border-transparent hover:border-gray-300 focus:border-gray-400 transition-colors cursor-text min-w-[20px] print:hover:bg-transparent print:border-transparent print:p-0 print:m-0",
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-gray-900 p-12 min-h-[1056px] print:min-h-0 shadow-sm print:shadow-none font-sans group/template">
      {/* Header */}
      <div className="mb-10 relative group/section">
        <h1 
          className="text-3xl font-light tracking-wide mb-2"
          {...editableProps("fullName", (v) => updateField("fullName", v))}
        >
          {data.fullName || "Your Name"}
        </h1>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
          <div>
            <span {...editableProps("email", (v) => updateField("email", v))}>{data.email || "Email"}</span>
            <span className="ml-4" {...editableProps("phone", (v) => updateField("phone", v))}>{data.phone || "Phone"}</span>
            <span className="ml-4" {...editableProps("location", (v) => updateField("location", v))}>{data.location || "Location"}</span>
          </div>
          <div className="flex gap-4">
            <a href={formatUrl(data.links?.linkedin || "", 'linkedin')} className="hover:text-gray-900 flex items-center gap-1" target="_blank" rel="noopener noreferrer" onClick={(e) => isEditable && e.preventDefault()}>
              <span {...editableProps("linkedin", (v) => updateLink("linkedin", v))}>{data.links?.linkedin ? "LinkedIn" : "Add LinkedIn"}</span>
            </a>
            <a href={formatUrl(data.links?.github || "", 'github')} className="hover:text-gray-900 flex items-center gap-1" target="_blank" rel="noopener noreferrer" onClick={(e) => isEditable && e.preventDefault()}>
              <span {...editableProps("github", (v) => updateLink("github", v))}>{data.links?.github ? "GitHub" : "Add GitHub"}</span>
            </a>
            <a href={formatUrl(data.links?.portfolio || "")} className="hover:text-gray-900 flex items-center gap-1" target="_blank" rel="noopener noreferrer" onClick={(e) => isEditable && e.preventDefault()}>
              <span {...editableProps("portfolio", (v) => updateLink("portfolio", v))}>{data.links?.portfolio ? "Portfolio" : "Add Portfolio"}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-8 relative group/section">
        <p 
          className="text-gray-700 leading-relaxed font-light text-sm"
          {...editableProps("summary", (v) => updateField("summary", v))}
        >
          {data.summary || "Write your professional summary here..."}
        </p>
      </div>

      {/* Experience */}
      <div 
        className="mb-10 relative group/section"
        style={{ marginTop: `${getSpacing('section-experience')}rem` }}
      >
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 border-b pb-2">Experience</h2>
        {isEditable && (
          <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
            <button onClick={() => updateSpacing('section-experience', 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Section Down"><ChevronsDown size={14} /></button>
            <button onClick={() => updateSpacing('section-experience', -1)} disabled={getSpacing('section-experience') === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30" title="Pull Section Up"><ChevronsUp size={14} /></button>
          </div>
        )}
        <div className="flex flex-col gap-6">
          {data.experience?.map((exp, idx) => (
            <div 
              key={idx} 
              className="grid grid-cols-12 gap-4 relative group/item"
              style={{ marginTop: `${getSpacing(`experience-${idx}`)}rem` }}
            >
              <div className="col-span-3 text-xs text-gray-500 pt-1 uppercase tracking-wide flex gap-1">
                <span {...editableProps("startDate", (v) => updateArray("experience", idx, "startDate", v))}>{exp.startDate || "Start"}</span> - 
                <span {...editableProps("endDate", (v) => updateArray("experience", idx, "endDate", v))}>{exp.endDate || "Present"}</span>
              </div>
              <div className="col-span-9">
                <div 
                  className="font-semibold text-gray-900"
                  {...editableProps("title", (v) => updateArray("experience", idx, "title", v))}
                >
                  {exp.title || "Job Title"}
                </div>
                <div 
                  className="text-gray-600 text-sm mb-2 font-medium"
                  {...editableProps("company", (v) => updateArray("experience", idx, "company", v))}
                >
                  {exp.company || "Company"}
                </div>
                <p 
                  className="text-gray-600 text-sm leading-relaxed font-light whitespace-pre-wrap"
                  {...editableProps("description", (v) => updateArray("experience", idx, "description", v))}
                >
                  {exp.description || "Job description..."}
                </p>
              </div>

              {isEditable && (
                <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden">
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
              className="mt-2 py-2 w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors print:hidden text-sm font-light"
            >
              <Plus size={16} /> Add Experience
            </button>
          )}
        </div>
      </div>

      {/* Projects */}
      <div 
        className="mb-10 relative group/section"
        style={{ marginTop: `${getSpacing('section-projects')}rem` }}
      >
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 border-b pb-2">Projects</h2>
        {isEditable && (
          <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
            <button onClick={() => updateSpacing('section-projects', 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Section Down"><ChevronsDown size={14} /></button>
            <button onClick={() => updateSpacing('section-projects', -1)} disabled={getSpacing('section-projects') === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30" title="Pull Section Up"><ChevronsUp size={14} /></button>
          </div>
        )}
        <div className="flex flex-col gap-6">
          {data.projects?.map((proj, idx) => (
            <div 
              key={idx} 
              className="grid grid-cols-12 gap-4 relative group/item"
              style={{ marginTop: `${getSpacing(`projects-${idx}`)}rem` }}
            >
              <div className="col-span-3 text-xs text-gray-500 pt-1 uppercase tracking-wide flex gap-1">
                <span {...editableProps("startDate", (v) => updateArray("projects", idx, "startDate", v))}>{proj.startDate || "Start"}</span> - 
                <span {...editableProps("endDate", (v) => updateArray("projects", idx, "endDate", v))}>{proj.endDate || "Present"}</span>
              </div>
              <div className="col-span-9">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span {...editableProps("name", (v) => updateArray("projects", idx, "name", v))}>{proj.name || "Project"}</span>
                  <a href={formatUrl(proj.url || "")} className="text-gray-400 hover:text-gray-900 font-normal text-xs" target="_blank" rel="noopener noreferrer" onClick={(e) => isEditable && e.preventDefault()}>
                    <span {...editableProps("url", (v) => updateArray("projects", idx, "url", v))}>{proj.url ? "[Link]" : "[Add Link]"}</span>
                  </a>
                </h4>
                <div 
                  className="text-gray-500 text-xs mb-2 font-mono"
                  {...editableProps("technologies", (v) => updateArray("projects", idx, "technologies", v.split(" / ")))}
                >
                  {proj.technologies?.join(" / ") || "Tech"}
                </div>
                <p 
                  className="text-gray-600 text-sm leading-relaxed font-light whitespace-pre-wrap"
                  {...editableProps("description", (v) => updateArray("projects", idx, "description", v))}
                >
                  {proj.description || "Description"}
                </p>
              </div>

              {isEditable && (
                <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden">
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
              className="mt-2 py-2 w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors print:hidden text-sm font-light"
            >
              <Plus size={16} /> Add Project
            </button>
          )}
        </div>
      </div>

      {/* Education */}
      <div 
        className="mb-10 relative group/section"
        style={{ marginTop: `${getSpacing('section-education')}rem` }}
      >
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 border-b pb-2">Education</h2>
        {isEditable && (
          <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
            <button onClick={() => updateSpacing('section-education', 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Section Down"><ChevronsDown size={14} /></button>
            <button onClick={() => updateSpacing('section-education', -1)} disabled={getSpacing('section-education') === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30" title="Pull Section Up"><ChevronsUp size={14} /></button>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {data.education?.map((edu, idx) => (
            <div 
              key={idx} 
              className="grid grid-cols-12 gap-4 relative group/item"
              style={{ marginTop: `${getSpacing(`education-${idx}`)}rem` }}
            >
              <div className="col-span-3 text-xs text-gray-500 pt-1 uppercase tracking-wide flex gap-1">
                <span {...editableProps("startDate", (v) => updateArray("education", idx, "startDate", v))}>{edu.startDate || "Start"}</span> - 
                <span {...editableProps("endDate", (v) => updateArray("education", idx, "endDate", v))}>{edu.endDate || "Present"}</span>
              </div>
              <div className="col-span-9">
                <div 
                  className="font-semibold text-gray-900"
                  {...editableProps("degree", (v) => updateArray("education", idx, "degree", v))}
                >
                  {edu.degree || "Degree"}
                </div>
                <div 
                  className="text-gray-600 text-sm"
                  {...editableProps("institution", (v) => updateArray("education", idx, "institution", v))}
                >
                  {edu.institution || "Institution"}
                </div>
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
              className="mt-2 py-2 w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors print:hidden text-sm font-light"
            >
              <Plus size={16} /> Add Education
            </button>
          )}
        </div>
      </div>

      {/* Skills & Certifications */}
      <div className="grid grid-cols-12 gap-4 relative group/section">
        <div className="col-span-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Skills</h2>
            <div 
              className="text-sm font-light text-gray-700 leading-relaxed"
              {...editableProps("skills", (v) => {
                if (!onChange) return;
                const skillsList = v.split("•").map(s => s.trim());
                onChange({
                  ...data,
                  skills: {
                    ...data.skills,
                    technical: skillsList.map(s => ({ name: s, level: "Intermediate" }))
                  }
                });
              })}
            >
              {data.skills?.technical?.map(s => s.name).concat(data.skills?.nonTechnical?.map(s => s.name) || []).join(" • ") || "Skill 1 • Skill 2"}
            </div>
          </div>
        </div>
        <div 
          className="col-span-6 relative group/section"
          style={{ marginTop: `${getSpacing('section-certifications')}rem` }}
        >
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Certifications</h2>
            {isEditable && (
              <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
                <button onClick={() => updateSpacing('section-certifications', 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Section Down"><ChevronsDown size={14} /></button>
                <button onClick={() => updateSpacing('section-certifications', -1)} disabled={getSpacing('section-certifications') === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30" title="Pull Section Up"><ChevronsUp size={14} /></button>
              </div>
            )}
            <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
              {data.certifications?.map((cert, idx) => (
                <div 
                  key={idx} 
                  className="relative group/item flex items-center"
                  style={{ marginTop: `${getSpacing(`certifications-${idx}`)}rem` }}
                >
                  <div className="flex-1">
                    <span 
                      className="font-medium text-gray-900"
                      {...editableProps("name", (v) => updateArray("certifications", idx, "name", v))}
                    >
                      {cert.name || "Certification"}
                    </span> — 
                    <span {...editableProps("issuer", (v) => updateArray("certifications", idx, "issuer", v))}>{cert.issuer || "Issuer"}</span> 
                    (<span {...editableProps("date", (v) => updateArray("certifications", idx, "date", v))}>{cert.date || "Date"}</span>)
                  </div>
                  {isEditable && (
                    <div className="absolute -right-6 top-0 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden">
                      <button onClick={() => updateSpacing(`certifications-${idx}`, 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Item Down"><ChevronsDown size={12} /></button>
                      <button onClick={() => updateSpacing(`certifications-${idx}`, -1)} disabled={getSpacing(`certifications-${idx}`) === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronsUp size={12} /></button>
                      <button 
                        onClick={() => moveArrayItem("certifications", idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button 
                        onClick={() => moveArrayItem("certifications", idx, 1)}
                        disabled={idx === (data.certifications?.length || 0) - 1}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button 
                        onClick={() => deleteArrayItem("certifications", idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {isEditable && (
                <button 
                  onClick={() => addArrayItem("certifications", { name: "Certificate", issuer: "Issuer", date: "2023" })}
                  className="mt-2 py-1 w-full border border-dashed border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 rounded flex items-center justify-center gap-1 transition-colors print:hidden text-xs"
                >
                  <Plus size={14} /> Add Certification
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
