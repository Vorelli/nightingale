import React, { ReactElement, useEffect, useState } from "react";
import anime, { easings } from "animejs";
import Bar from "./Bar";
import easingNames from "../helpers/anime";
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

      // Normalize the frequency data to a range between 1 and 100
      const normalizedData = Array.from(dataArray)
        .slice(0, -1 * Math.floor(numBars * 0.1) + 1)
        .map((val) => val * 2); //.map((value) => (value / 255) * 100));

      // Update scaleY of the bars using animejs
      /* anime({
        targets: ".bar",
        scaleY: normalizedData,
        duration: 0,
      }); */
      setData(normalizedData);
      requestAnimationFrame(update);
    };

    update();
  }, [c?.analyzerNode]);

  // setInterval(() => {
  //   const easingName = easingNames[Math.floor(easingNames.length * Math.random())];
  //   console.log(Math.random() * easingNames.length);
  //   console.log(easingName, easingNames);
  //   anime({
  //     duration: 1500,
  //     targets: ".bar",
  //     scaleY: anime.stagger([1, 250], {
  //       easing: easingName,
  //       from: "center",
  //       direction: "reverse",
  //     }),

  //     // }),
  //     // delay: anime.stagger(7, { from: "center" }),
  //     //opacity: anime.stagger(anime.random(0.1, 0.9), { from: "center" }) /*
  //     //loop: true, */,
  //   });
  // }, 2000);

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
