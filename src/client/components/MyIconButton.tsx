import { IconButton } from "@mui/material";
import React, { PropsWithChildren } from "react";

type Props = {};

function MyIconButton(props: PropsWithChildren) {
  return (
    //<li className="playlistLabel hover:before:opacity-0 before:transition-all before:duration-500 hover:shadow-base-100 transition-all
    //    hover:shadow-lg rounded-[5px] before:rounded-[5px] text-neutral-content shadow shadow-neutral-focus border-primary border-solid m-[1px]
    //    w-20 h-[30px] bg-secondary relative z-10 before:z-[-10] border-[1px] border-transparent before:w-full before:bg-base-100 before:absolute before:h-full before:left-0">
    <IconButton
      className="iconButton bg-gradient-to-r from-primary via-secondary to-primary hover:before:bg-transparent !text-base-content transition-all before:transition-all before:rounded-full !relative hover:!bg-primary !z-10 before:z-[-10] !border-solid !border-[1px] !border-transparent before:w-full before:bg-base-100 before:absolute before:h-full before:left-0 !rounded-full !p-0 !w-10 !h-10"
      sx={{ display: "flex" }}
    >
      {props.children}
    </IconButton>
  );
}

export default MyIconButton;
