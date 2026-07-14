import React from "react";
import type { ParsedCVData } from "../../types";

interface Props {
  data: ParsedCVData;
}

export function MinimalistTemplate({ data }: Props) {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-gray-900 p-12 min-h-[1056px] shadow-sm font-sans">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-light tracking-wide mb-2">
          {data.fullName || "Your Name"}
        </h1>
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 uppercase tracking-widest">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
          {data.links?.linkedin && <a href={data.links.linkedin} className="hover:text-gray-900">LinkedIn</a>}
          {data.links?.github && <a href={data.links.github} className="hover:text-gray-900">GitHub</a>}
          {data.links?.portfolio && <a href={data.links.portfolio} className="hover:text-gray-900">Portfolio</a>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-8">
          <p className="text-gray-700 leading-relaxed font-light text-sm">
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 border-b pb-2">Experience</h2>
          <div className="flex flex-col gap-6">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4">
                <div className="col-span-3 text-xs text-gray-500 pt-1 uppercase tracking-wide">
                  {exp.startDate} - {exp.endDate || "Present"}
                </div>
                <div className="col-span-9">
                  <div className="font-semibold text-gray-900">{exp.title}</div>
                  <div className="text-gray-600 text-sm mb-2 font-medium">{exp.company}</div>
                  {exp.description && (
                    <p className="text-gray-600 text-sm leading-relaxed font-light whitespace-pre-wrap">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 border-b pb-2">Projects</h2>
          <div className="flex flex-col gap-6">
            {data.projects.map((proj, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4">
                <div className="col-span-3 text-xs text-gray-500 pt-1 uppercase tracking-wide">
                  {proj.startDate && proj.endDate ? `${proj.startDate} - ${proj.endDate}` : proj.startDate || proj.endDate || ""}
                </div>
                <div className="col-span-9">
                  <div className="font-semibold text-gray-900">
                    {proj.name}
                    {proj.url && <a href={proj.url} className="text-gray-400 hover:text-gray-900 ml-2 font-normal text-xs">[Link]</a>}
                  </div>
                  <div className="text-gray-500 text-xs mb-2 font-mono">
                    {proj.technologies?.join(" / ")}
                  </div>
                  {proj.description && (
                    <p className="text-gray-600 text-sm leading-relaxed font-light whitespace-pre-wrap">
                      {proj.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 border-b pb-2">Education</h2>
          <div className="flex flex-col gap-4">
            {data.education.map((edu, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4">
                <div className="col-span-3 text-xs text-gray-500 pt-1 uppercase tracking-wide">
                  {edu.startDate} - {edu.endDate || "Present"}
                </div>
                <div className="col-span-9">
                  <div className="font-semibold text-gray-900">{edu.degree}</div>
                  <div className="text-gray-600 text-sm">{edu.institution}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills & Certifications */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          {(data.skills?.technical?.length > 0 || data.skills?.nonTechnical?.length > 0) && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Skills</h2>
              <div className="text-sm font-light text-gray-700 leading-relaxed">
                {data.skills.technical.map(s => s.name).concat(data.skills.nonTechnical.map(s => s.name)).join(" • ")}
              </div>
            </div>
          )}
        </div>
        <div className="col-span-6">
          {data.certifications && data.certifications.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Certifications</h2>
              <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
                {data.certifications.map((cert, idx) => (
                  <div key={idx}>
                    <span className="font-medium text-gray-900">{cert.name}</span> — {cert.issuer} ({cert.date})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
