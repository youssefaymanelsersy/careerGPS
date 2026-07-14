import React from "react";
import type { ParsedCVData } from "../../types";
import { MapPin, Mail, Phone, Globe } from "lucide-react";

interface Props {
  data: ParsedCVData;
}

export function ClassicTemplate({ data }: Props) {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-10 min-h-[1056px] shadow-lg text-sm font-serif">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-4 text-center">
        <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">
          {data.fullName || "Your Name"}
        </h1>
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-gray-700">
          {data.email && (
            <span className="flex items-center gap-1">
              <Mail size={14} /> {data.email}
            </span>
          )}
          {data.phone && (
            <span className="flex items-center gap-1">
              <Phone size={14} /> {data.phone}
            </span>
          )}
          {data.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {data.location}
            </span>
          )}
        </div>
        <div className="flex flex-wrap justify-center items-center gap-4 mt-2 text-gray-700">
          {data.links?.linkedin && (
            <a href={data.links.linkedin} className="flex items-center gap-1 text-blue-600 hover:underline">
              LinkedIn
            </a>
          )}
          {data.links?.github && (
            <a href={data.links.github} className="flex items-center gap-1 text-gray-900 hover:underline">
              GitHub
            </a>
          )}
          {data.links?.portfolio && (
            <a href={data.links.portfolio} className="flex items-center gap-1 text-blue-600 hover:underline">
              <Globe size={14} /> Portfolio
            </a>
          )}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-2 pb-1">
            Professional Summary
          </h2>
          <p className="text-gray-800 leading-relaxed text-justify">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">
            Experience
          </h2>
          <div className="flex flex-col gap-4">
            {data.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-base">{exp.title}</h3>
                  <span className="text-gray-600 italic">
                    {exp.startDate} - {exp.endDate || "Present"}
                  </span>
                </div>
                <div className="font-semibold text-gray-700 mb-1">{exp.company}</div>
                {exp.description && (
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">
            Projects
          </h2>
          <div className="flex flex-col gap-4">
            {data.projects.map((proj, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-base">
                    {proj.name}
                    {proj.url && (
                      <a href={proj.url} className="text-blue-600 font-normal ml-2 hover:underline text-xs">
                        [Link]
                      </a>
                    )}
                  </h3>
                  <span className="text-gray-600 italic">
                    {proj.startDate && proj.endDate ? `${proj.startDate} - ${proj.endDate}` : proj.startDate || proj.endDate || ""}
                  </span>
                </div>
                <div className="text-gray-600 text-xs mb-1 italic">
                  {proj.technologies?.join(", ")}
                </div>
                {proj.description && (
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education & Certifications (Two Columns) */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        {data.education && data.education.length > 0 && (
          <div>
            <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">
              Education
            </h2>
            <div className="flex flex-col gap-3">
              {data.education.map((edu, idx) => (
                <div key={idx}>
                  <div className="font-bold">{edu.institution}</div>
                  <div className="text-gray-800">
                    {edu.degree} {edu.major ? `in ${edu.major}` : ""}
                  </div>
                  <div className="text-gray-600 italic text-xs">
                    {edu.startDate} - {edu.endDate || "Present"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <div>
            <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">
              Certifications
            </h2>
            <div className="flex flex-col gap-3">
              {data.certifications.map((cert, idx) => (
                <div key={idx}>
                  <div className="font-bold">{cert.name}</div>
                  <div className="text-gray-800">{cert.issuer}</div>
                  <div className="text-gray-600 italic text-xs">{cert.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skills */}
      {(data.skills?.technical?.length > 0 || data.skills?.nonTechnical?.length > 0) && (
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">
            Skills
          </h2>
          {data.skills.technical.length > 0 && (
            <div className="mb-2">
              <span className="font-bold mr-2">Technical:</span>
              <span className="text-gray-800">
                {data.skills.technical.map((s) => s.name).join(", ")}
              </span>
            </div>
          )}
          {data.skills.nonTechnical.length > 0 && (
            <div>
              <span className="font-bold mr-2">Soft Skills:</span>
              <span className="text-gray-800">
                {data.skills.nonTechnical.map((s) => s.name).join(", ")}
              </span>
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div className="mt-2">
              <span className="font-bold mr-2">Languages:</span>
              <span className="text-gray-800">{data.languages.join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
