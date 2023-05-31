import React from "react";

interface Props {
  line: string;
}

const InfoLine = ({ line }: Props) => {
  return <p dangerouslySetInnerHTML={{ __html: line }}></p>;
};

export default InfoLine;
