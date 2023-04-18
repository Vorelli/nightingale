import { IconButton } from "@mui/material";
import React, { PropsWithChildren } from "react";
import { RootState } from "../redux/store";
import { useSelector } from "react-redux";

type Props = {};

function MyIconButton(props: PropsWithChildren) {
  const windowHidden = useSelector((s: RootState) => s.windows["main"].hidden);
  return (
    <IconButton
      className={
        "iconButton bg-gradient-to-r from-primary via-secondary to-primary hover:before:bg-transparent !text-base-content transition-all before:transition-all before:rounded-full !relative hover:!bg-primary !z-10 before:z-[-10] !border-solid !border-[1px] !border-transparent before:w-full before:bg-base-100 before:absolute before:h-full before:left-0 !rounded-full !p-0" +
        (windowHidden ? " !w-5 !h-5" : " !w-10 !h-10")
      }
      sx={{ display: "flex" }}
    >
      {props.children}
    </IconButton>
  );
}

export default MyIconButton;
