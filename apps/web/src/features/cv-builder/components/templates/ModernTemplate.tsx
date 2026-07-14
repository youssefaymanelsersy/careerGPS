import React from "react";
import type { ParsedCVData } from "../../types";
import { MapPin, Mail, Phone, Globe, Briefcase, GraduationCap, Code, Award } from "lucide-react";

interface Props {
  data: ParsedCVData;
}

export function ModernTemplate({ data }: Props) {
  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-50 text-gray-900 min-h-[1056px] shadow-xl flex font-sans">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-blue-900 text-white p-8 flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-blue-50">
            {data.fullName || "Your Name"}
          </h1>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-3 text-sm text-blue-100">
          {data.email && (
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-blue-400" /> <span>{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-blue-400" /> <span>{data.phone}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-400" /> <span>{data.location}</span>
            </div>
          )}
          {data.links?.linkedin && (
            <a href={data.links.linkedin} className="flex items-center gap-2 hover:text-white transition-colors">
              <span>LinkedIn</span>
            </a>
          )}
          {data.links?.github && (
            <a href={data.links.github} className="flex items-center gap-2 hover:text-white transition-colors">
              <span>GitHub</span>
            </a>
          )}
          {data.links?.portfolio && (
            <a href={data.links.portfolio} className="flex items-center gap-2 hover:text-white transition-colors">
              <Globe size={16} className="text-blue-400" /> <span>Portfolio</span>
            </a>
          )}
        </div>

        {/* Skills */}
        {(data.skills?.technical?.length > 0 || data.skills?.nonTechnical?.length > 0) && (
          <div>
            <h3 className="text-lg font-semibold uppercase tracking-wider mb-4 border-b border-blue-700 pb-2 flex items-center gap-2">
              <Code size={18} /> Skills
            </h3>
            {data.skills.technical.length > 0 && (
              <div className="mb-4">
                <div className="font-medium text-blue-200 mb-2 text-xs uppercase tracking-wider">Technical</div>
                <div className="flex flex-wrap gap-2">
                  {data.skills.technical.map((s, i) => (
                    <span key={i} className="bg-blue-800 text-blue-100 px-2 py-1 rounded text-xs">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.skills.nonTechnical.length > 0 && (
              <div>
                <div className="font-medium text-blue-200 mb-2 text-xs uppercase tracking-wider">Soft Skills</div>
                <div className="flex flex-wrap gap-2">
                  {data.skills.nonTechnical.map((s, i) => (
                    <span key={i} className="bg-blue-800 text-blue-100 px-2 py-1 rounded text-xs">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold uppercase tracking-wider mb-4 border-b border-blue-700 pb-2 flex items-center gap-2">
              <GraduationCap size={18} /> Education
            </h3>
            <div className="flex flex-col gap-4">
              {data.education.map((edu, idx) => (
                <div key={idx} className="text-sm">
                  <div className="font-semibold text-white">{edu.degree}</div>
                  <div className="text-blue-200">{edu.institution}</div>
                  <div className="text-blue-300 text-xs mt-1">
                    {edu.startDate} - {edu.endDate || "Present"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-2/3 p-10 bg-white">
        {/* Summary */}
        {data.summary && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
              Profile
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm text-justify">
              {data.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
              <Briefcase size={20} className="text-blue-600" /> Experience
            </h3>
            <div className="flex flex-col gap-6">
              {data.experience.map((exp, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-gray-200">
                  <div className="absolute w-2 h-2 bg-blue-600 rounded-full -left-[5px] top-1.5" />
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-gray-900 text-lg">{exp.title}</h4>
                    <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                      {exp.startDate} - {exp.endDate || "Present"}
                    </span>
                  </div>
                  <div className="font-medium text-blue-700 mb-2">{exp.company}</div>
                  {exp.description && (
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
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
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
              <Code size={20} className="text-blue-600" /> Projects
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {data.projects.map((proj, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-gray-900">{proj.name}</h4>
                    {proj.url && (
                      <a href={proj.url} className="text-blue-600 text-xs hover:underline">
                        View Project
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {proj.technologies?.join(" • ")}
                  </div>
                  {proj.description && (
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {proj.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
              <Award size={20} className="text-blue-600" /> Certifications
            </h3>
            <div className="flex flex-col gap-3">
              {data.certifications.map((cert, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-gray-900">{cert.name}</div>
                    <div className="text-sm text-gray-600">{cert.issuer}</div>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{cert.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
