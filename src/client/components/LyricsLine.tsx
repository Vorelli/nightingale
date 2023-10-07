import React from "react";

interface Props {
  line: string;
}

const LyricsLine = ({ line }: Props) => {
  return <p dangerouslySetInnerHTML={{ __html: line }}></p>;
};

export default LyricsLine;
