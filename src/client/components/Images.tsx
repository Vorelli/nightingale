import React, { useEffect, useState } from "react";
import { Image } from "./Project";
import { Button, Card, IconButton } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import West from "@mui/icons-material/West";
import East from "@mui/icons-material/East";
import { useProjectImageContext } from "./ProjectImageContextProvider";

interface Props {
  images: Image[];
}
const Images = ({ images }: Props) => {
  const [auto, setAuto] = useState(true);
  const imageC = useProjectImageContext();
  const [i, setI] = useState<number>(imageC?.lastI ?? 0);

  useEffect(() => {
    if (
      !imageC ||
      (imageC && (imageC.lastFirst === null || imageC.lastFirst !== images[0]))
    ) {
      setI(0);
      imageC?.setLastFirst(images[0]);
    } else {
      setI(imageC.lastI);
    }

    setAuto(() => {
      setAuto(true);
      return false;
    });
  }, [images]);

  return (
    <Carousel
      className="w-full h-full p-9"
      cycleNavigation={true}
      navButtonsAlwaysVisible={true}
      stopAutoPlayOnHover={true}
      index={i}
      next={() => setI((i) => (i + 1) % images.length)}
      prev={() => setI((i) => (i - 1) % images.length)}
      autoPlay={auto}
      height="100%"
      NavButton={({ next, className, style, onClick }) => {
        className += " bg-base-100 color-primary";
        return (
          <IconButton
            onClick={onClick as React.MouseEventHandler}
            className={className}
            style={style}
          >
            {(next && <East />) || <West />}
          </IconButton>
        );
      }}
    >
      {images.map((image, imageI) => (
        <Card
          key={image.src}
          className="h-full w-full overflow-y-scroll !shadow-none !bg-transparent"
        >
          <img
            src={image.src}
            className="object-contain h-full m-auto"
            alt={image.alt}
            onClick={() => {
              imageC?.setImage(image);
              imageC?.toggleZoom(imageI);
            }}
          ></img>
        </Card>
      ))}
    </Carousel>
  );
};

export default Images;
