import React, { useEffect, useState } from "react";

interface Props {
  technology: string[];
}

enum Category {
  "Back End",
  "Front end",
  "Development/Build Tools",
  "Deployment",
  null,
}

const categories = {
  typescript: Category["Back End"],
  "express.js": Category["Back End"],
  react: Category["Front end"],
  redux: Category["Front end"],
  postgres: Category["Back End"],
  tailwind: Category["Front end"],
  docker: Category["Development/Build Tools"],
  babel: Category["Development/Build Tools"],
  sqlite: Category["Back End"],
  neon: Category["Deployment"],
  drizzle: Category["Back End"],
  aws: Category["Deployment"],
  ffmpeg: Category["Back End"],
  html: Category["Front end"],
  css: Category["Front end"],
  webpack: Category["Development/Build Tools"],
  "material.ui": Category["Front end"],
} as { [key: string]: Category | undefined };

const TechnologyBullets = ({ technology }: Props) => {
  console.log("tech:", technology);
  const technologiesMap = technology.reduce((acc, tech) => {
    const category: keyof typeof Category = Category[
      categories[tech.toLowerCase()] ?? Category.null
    ] as keyof typeof Category;
    acc.set(category, [...(acc.get(category) || []), tech]);
    return acc;
  }, new Map() as Map<keyof typeof Category, undefined | string[]>);
  const [lists, setLists] = useState(new Array<React.ReactElement>());
  useEffect(() => {
    let tempArr = new Array<React.ReactElement>();
    technologiesMap.forEach((_, k: keyof typeof Category) => {
      const techs = (technologiesMap.get(k) || []) as (keyof typeof Category)[];
      if (k === "null" || techs === undefined) return;
      tempArr.push(
        <div
          key={k}
          className="h-[50%] w-[50%] pt-2 pb-2 text-center overflow-y-auto float-left"
        >
          <ul className="inline-block list-disc">
            <h4 className="underline font-bold">{k}:</h4>
            {techs.map((tech: keyof typeof Category) => (
              <li>{tech}</li>
            ))}
          </ul>
        </div>
      );
    });
    setLists(tempArr);
  }, [technology]);

  return (
    <div className="h-full flex flex-wrap justify-between">
      <div className="w-full h-full pt-4 flex flex-col justify-center">
        <div>
          <h4 className="text-center">Technology Used</h4>
        </div>
        <div className="w-full h-full">{lists}</div>
      </div>
    </div>
  );
};

TechnologyBullets.whyDidYouRender = true;
export default TechnologyBullets;
