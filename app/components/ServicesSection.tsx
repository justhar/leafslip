import React from "react";
import { SERVICES } from "../constants";

export default function ServicesSection() {
  return (
    <section
      className="bg-white text-[#2D3E2D] py-24 md:py-12 overflow-hidden"
      id="services"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
              OUR EXPERTISE
            </span>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Explore More of
              <br />
              Our Services
            </h2>
          </div>
          <button className="bg-transparent border border-gray-200 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors">
            ALL SERVICES
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className="bg-[#D9ED92]/20 rounded-[40px] p-10 flex flex-col h-full hover:shadow-lg transition-all border border-transparent hover:border-[#D9ED92]/50 group"
            >
              <div className="mb-8 p-3 bg-white w-fit rounded-2xl shadow-sm">
                <svg
                  className="w-8 h-8 text-[#2D3E2D]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-[#2D3E2D] transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-10 flex-grow">
                {service.description}
              </p>
              <div className="pt-6">
                <span className="bg-white text-[#2D3E2D] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                  {service.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
