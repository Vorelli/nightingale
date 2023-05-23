import React, { ReactElement, useEffect, useState } from "react";
import Bar from "./Bar";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useAudioContext } from "./AudioContextProvider";

type Props = {};

function Background({}: Props) {
  const [data, setData] = useState(new Array(64).fill(10));
  const { numBars } = useSelector((s: RootState) => s.audio);
  const c = useAudioContext();

  useEffect(() => {
    if (c === null || c?.analyzerNode === null) return;
    const analyzer = c?.analyzerNode;

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);

    const update = () => {
      analyzer.getByteFrequencyData(dataArray);
      const normalizedData = Array.from(dataArray)
        .slice(0, -1 * Math.floor(numBars * 0.1) + 1)
        .map((val) => val * 2);
      setData(normalizedData);
      requestAnimationFrame(update);
    };

    update();
  }, [c?.analyzerNode]);

  return (
    <div className="fixed z-[-20] top-0 left-0 w-full h-full bg-neutral">
      <div
        className={
          "barContainer m-auto xs:-max-w-ms sm:max-w-sm lg:max-w-lg h-full flex items-center"
        }
      >
        {data.map<ReactElement>((l, i) => {
          return <Bar key={i} l={l} />;
        })}
      </div>
    </div>
  );
}

export default Background;
