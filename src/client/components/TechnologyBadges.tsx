import React from "react";

interface Props {
  technology: string[];
}

const badges = {
  typescript:
    "https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white",
  "express.js":
    "https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB",
  react:
    "https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB",
  redux:
    "https://img.shields.io/badge/redux-%23593d88.svg?style=for-the-badge&logo=redux&logoColor=white",
  postgres:
    "https://img.shields.io/badge/database-postgresql-f6c819?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=21223e",
  tailwind:
    "https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white",
  docker:
    "https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white",
  babel:
    "https://img.shields.io/badge/Babel-F9DC3e?style=for-the-badge&logo=babel&logoColor=black",
  sqlite:
    "https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white",
  aws: "https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white",
  html: "https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white",
  css: "https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white",
  webpack:
    "https://img.shields.io/badge/webpack-%238DD6F9.svg?style=for-the-badge&logo=webpack&logoColor=black",
  "material.ui":
    "https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white",
  "next.js":
    "https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white",
  javascript:
    "https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E",
  axios:
    "https://img.shields.io/badge/-Axios-671ddf?logo=axios&logoColor=black&style=for-the-badge",
  vercel:
    "https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white",
} as { [key: string]: string | undefined };

const TechnologyBadges = ({ technology }: Props) => {
  return (
    <div className="flex flex-wrap justify-between">
      <div className="w-full flex justify-center">
        <h4>Technology Used</h4>
      </div>
      {technology
        .filter((tech) => !!badges[tech.toLowerCase()])
        .map((tech) => (
          <img
            key={tech}
            className="object-contain"
            src={badges[tech.toLowerCase()]}
          />
        ))}
    </div>
  );
};

export default TechnologyBadges;
