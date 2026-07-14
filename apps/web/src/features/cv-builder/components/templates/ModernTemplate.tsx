import React from "react";
import type { ParsedCVData } from "../../types";
import { MapPin, Mail, Phone, Globe, Briefcase, GraduationCap, Code, Award, Plus, Trash2, ArrowUp, ArrowDown, ChevronsDown, ChevronsUp } from "lucide-react";
import { formatUrl } from "../../utils/formatUrl";

interface Props {
  data: ParsedCVData;
  onChange?: (data: ParsedCVData) => void;
}

export function ModernTemplate({ data, onChange }: Props) {
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

  const editableProps = (field: string, onUpdate: (val: string) => void, lightText: boolean = false) => {
    if (!isEditable) return {};
    
    // Different hover effects depending on whether the text is on dark blue or light background
    const hoverBg = lightText ? "hover:bg-blue-800 focus:bg-blue-800" : "hover:bg-blue-50 focus:bg-blue-50";
    const focusBorder = lightText ? "focus:border-blue-400" : "focus:border-blue-400";
    
    return {
      contentEditable: true,
      suppressContentEditableWarning: true,
      onBlur: (e: React.FocusEvent<HTMLElement>) => onUpdate(e.currentTarget.textContent || ""),
      className: `${hoverBg} outline-none rounded px-1 -mx-1 border border-transparent hover:border-blue-300/30 ${focusBorder} transition-colors cursor-text min-w-[20px] print:hover:bg-transparent print:border-transparent print:p-0 print:m-0`,
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-50 text-gray-900 min-h-[1056px] print:min-h-0 shadow-xl print:shadow-none flex font-sans group/template">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-blue-900 text-white p-8 flex flex-col gap-8">
        <div>
          <h1 
            className="text-3xl font-extrabold tracking-tight mb-2 text-blue-50"
            {...editableProps("fullName", (v) => updateField("fullName", v), true)}
          >
            {data.fullName || "Your Name"}
          </h1>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-3 text-sm text-blue-100">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-blue-400 shrink-0" /> 
            <span {...editableProps("email", (v) => updateField("email", v), true)}>{data.email || "Email"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-blue-400 shrink-0" /> 
            <span {...editableProps("phone", (v) => updateField("phone", v), true)}>{data.phone || "Phone"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-400 shrink-0" /> 
            <span {...editableProps("location", (v) => updateField("location", v), true)}>{data.location || "Location"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold shrink-0">in</span>
            <span {...editableProps("linkedin", (v) => updateLink("linkedin", v), true)}>{data.links?.linkedin || "LinkedIn"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold shrink-0">gh</span>
            <span {...editableProps("github", (v) => updateLink("github", v), true)}>{data.links?.github || "GitHub"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-blue-400 shrink-0" /> 
            <span {...editableProps("portfolio", (v) => updateLink("portfolio", v), true)}>{data.links?.portfolio || "Portfolio"}</span>
          </div>
        </div>

        {/* Skills */}
        <div className="relative group/section">
          <h3 className="text-lg font-semibold uppercase tracking-wider mb-4 border-b border-blue-700 pb-2 flex items-center gap-2">
            <Code size={18} /> Skills
          </h3>
          <div className="mb-4">
            <div className="font-medium text-blue-200 mb-2 text-xs uppercase tracking-wider">Technical</div>
            <div 
              className="text-sm text-blue-100"
              {...editableProps("technicalSkills", (v) => {
                if (!onChange) return;
                onChange({
                  ...data,
                  skills: {
                    ...data.skills,
                    technical: v.split(",").map(s => ({ name: s.trim(), level: "Intermediate" }))
                  }
                });
              }, true)}
            >
              {data.skills?.technical?.map((s) => s.name).join(", ") || "Skill 1, Skill 2"}
            </div>
          </div>
          <div>
            <div className="font-medium text-blue-200 mb-2 text-xs uppercase tracking-wider">Soft Skills</div>
            <div 
              className="text-sm text-blue-100"
              {...editableProps("softSkills", (v) => {
                if (!onChange) return;
                onChange({
                  ...data,
                  skills: {
                    ...data.skills,
                    nonTechnical: v.split(",").map(s => ({ name: s.trim(), level: "Intermediate" }))
                  }
                });
              }, true)}
            >
              {data.skills?.nonTechnical?.map((s) => s.name).join(", ") || "Skill 1, Skill 2"}
            </div>
          </div>
        </div>

        {/* Education */}
        <div 
          className="relative group/section"
          style={{ marginTop: `${getSpacing('section-education')}rem` }}
        >
          <h3 className="text-lg font-semibold uppercase tracking-wider mb-4 border-b border-blue-700 pb-2 flex items-center gap-2">
            <GraduationCap size={18} /> Education
          </h3>
          {isEditable && (
            <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
              <button onClick={() => updateSpacing('section-education', 1)} className="p-1 text-blue-200 hover:bg-blue-800 rounded" title="Push Section Down"><ChevronsDown size={14} /></button>
              <button onClick={() => updateSpacing('section-education', -1)} disabled={getSpacing('section-education') === 0} className="p-1 text-blue-200 hover:bg-blue-800 rounded disabled:opacity-30" title="Pull Section Up"><ChevronsUp size={14} /></button>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {data.education?.map((edu, idx) => (
              <div 
                key={idx} 
                className="text-sm relative group/item"
                style={{ marginTop: `${getSpacing(`education-${idx}`)}rem` }}
              >
                <div 
                  className="font-semibold text-white"
                  {...editableProps("degree", (v) => updateArray("education", idx, "degree", v), true)}
                >
                  {edu.degree || "Degree"}
                </div>
                <div 
                  className="text-blue-200"
                  {...editableProps("institution", (v) => updateArray("education", idx, "institution", v), true)}
                >
                  {edu.institution || "Institution"}
                </div>
                <div className="text-blue-300 text-xs mt-1 flex gap-1">
                  <span {...editableProps("startDate", (v) => updateArray("education", idx, "startDate", v), true)}>{edu.startDate || "Start"}</span> - 
                  <span {...editableProps("endDate", (v) => updateArray("education", idx, "endDate", v), true)}>{edu.endDate || "Present"}</span>
                </div>
                {isEditable && (
                  <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden">
                    <button onClick={() => updateSpacing(`education-${idx}`, 1)} className="p-1 text-blue-200 hover:bg-blue-800 rounded" title="Push Item Down"><ChevronsDown size={14} /></button>
                    <button onClick={() => updateSpacing(`education-${idx}`, -1)} disabled={getSpacing(`education-${idx}`) === 0} className="p-1 text-blue-200 hover:bg-blue-800 rounded disabled:opacity-30"><ChevronsUp size={14} /></button>
                    <button 
                      onClick={() => moveArrayItem("education", idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-blue-200 hover:bg-blue-800 rounded disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => moveArrayItem("education", idx, 1)}
                      disabled={idx === (data.education?.length || 0) - 1}
                      className="p-1 text-blue-200 hover:bg-blue-800 rounded disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button 
                      onClick={() => deleteArrayItem("education", idx)}
                      className="p-1 text-red-400 hover:bg-blue-800 rounded"
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
                className="mt-2 py-1 w-full border border-dashed border-blue-700 text-blue-300 hover:border-blue-400 hover:text-blue-100 rounded flex items-center justify-center gap-1 transition-colors print:hidden text-xs"
              >
                <Plus size={14} /> Add Education
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-2/3 p-10 bg-white">
        {/* Summary */}
        <div className="mb-8 relative group/section">
          <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
            Profile
          </h3>
          <p 
            className="text-gray-600 leading-relaxed text-sm text-justify"
            {...editableProps("summary", (v) => updateField("summary", v))}
          >
            {data.summary || "Write your professional summary here..."}
          </p>
        </div>

        {/* Experience */}
        <div 
          className="mb-8 relative group/section"
          style={{ marginTop: `${getSpacing('section-experience')}rem` }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
            <Briefcase size={20} className="text-blue-600" /> Experience
          </h3>
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
                className="relative pl-4 border-l-2 border-gray-200 group/item"
                style={{ marginTop: `${getSpacing(`experience-${idx}`)}rem` }}
              >
                <div className="absolute w-2 h-2 bg-blue-600 rounded-full -left-[5px] top-1.5" />
                <div className="flex justify-between items-baseline mb-1">
                  <h4 
                    className="font-bold text-gray-900 text-lg"
                    {...editableProps("title", (v) => updateArray("experience", idx, "title", v))}
                  >
                    {exp.title || "Job Title"}
                  </h4>
                  <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded flex gap-1">
                    <span {...editableProps("startDate", (v) => updateArray("experience", idx, "startDate", v))}>{exp.startDate || "Start"}</span> - 
                    <span {...editableProps("endDate", (v) => updateArray("experience", idx, "endDate", v))}>{exp.endDate || "Present"}</span>
                  </span>
                </div>
                <div 
                  className="font-medium text-blue-700 mb-2"
                  {...editableProps("company", (v) => updateArray("experience", idx, "company", v))}
                >
                  {exp.company || "Company"}
                </div>
                <p 
                  className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap"
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
                className="mt-2 py-2 w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 rounded-lg flex items-center justify-center gap-2 transition-colors print:hidden text-sm"
              >
                <Plus size={16} /> Add Experience
              </button>
            )}
          </div>
        </div>

        {/* Projects */}
        <div 
          className="mb-8 relative group/section"
          style={{ marginTop: `${getSpacing('section-projects')}rem` }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
            <Code size={20} className="text-blue-600" /> Projects
          </h3>
          {isEditable && (
            <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
              <button onClick={() => updateSpacing('section-projects', 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Push Section Down"><ChevronsDown size={14} /></button>
              <button onClick={() => updateSpacing('section-projects', -1)} disabled={getSpacing('section-projects') === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30" title="Pull Section Up"><ChevronsUp size={14} /></button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            {data.projects?.map((proj, idx) => (
              <div 
                key={idx} 
                className="bg-gray-50 rounded-lg p-4 border border-gray-100 shadow-sm relative group/item"
                style={{ marginTop: `${getSpacing(`projects-${idx}`)}rem` }}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <h4 
                    className="font-bold text-gray-900"
                    {...editableProps("name", (v) => updateArray("projects", idx, "name", v))}
                  >
                    {proj.name || "Project"}
                  </h4>
                  <span className="text-gray-500 text-xs font-medium flex gap-1">
                    <span {...editableProps("startDate", (v) => updateArray("projects", idx, "startDate", v))}>{proj.startDate || "Start"}</span> - 
                    <span {...editableProps("endDate", (v) => updateArray("projects", idx, "endDate", v))}>{proj.endDate || "Present"}</span>
                  </span>
                </div>
                <div className="text-xs text-blue-600 mb-2 flex gap-1">
                  URL: <span {...editableProps("url", (v) => updateArray("projects", idx, "url", v))}>{proj.url || "N/A"}</span>
                </div>
                <div className="text-xs text-gray-500 mb-2 flex gap-1">
                  Tech: <span {...editableProps("technologies", (v) => updateArray("projects", idx, "technologies", v.split(",")))}>{proj.technologies?.join(", ") || "Tech"}</span>
                </div>
                <p 
                  className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap"
                  {...editableProps("description", (v) => updateArray("projects", idx, "description", v))}
                >
                  {proj.description || "Description"}
                </p>

                {isEditable && (
                  <div className="absolute -right-8 top-4 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden">
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
                className="mt-2 py-2 w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 rounded-lg flex items-center justify-center gap-2 transition-colors print:hidden text-sm"
              >
                <Plus size={16} /> Add Project
              </button>
            )}
          </div>
        </div>

        {/* Certifications */}
        <div 
          className="relative group/section"
          style={{ marginTop: `${getSpacing('section-certifications')}rem` }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
            <Award size={20} className="text-blue-600" /> Certifications
          </h3>
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
                className="flex justify-between items-center relative group/item"
                style={{ marginTop: `${getSpacing(`certifications-${idx}`)}rem` }}
              >
                <div>
                  <div 
                    className="font-bold text-gray-900"
                    {...editableProps("name", (v) => updateArray("certifications", idx, "name", v))}
                  >
                    {cert.name || "Certification"}
                  </div>
                  <div 
                    className="text-sm text-gray-600"
                    {...editableProps("issuer", (v) => updateArray("certifications", idx, "issuer", v))}
                  >
                    {cert.issuer || "Issuer"}
                  </div>
                </div>
                <div 
                  className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                  {...editableProps("date", (v) => updateArray("certifications", idx, "date", v))}
                >
                  {cert.date || "Date"}
                </div>

                {isEditable && (
                  <div className="absolute -right-8 top-1 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden">
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
                className="mt-2 py-2 w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 rounded-lg flex items-center justify-center gap-2 transition-colors print:hidden text-sm"
              >
                <Plus size={16} /> Add Certification
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
