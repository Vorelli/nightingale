import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const HeaderBar = (props: {
  onShowHideClick: Function;
  onMoveToTopClick: Function;
  storeName: string;
}) => {
  const { onTop, hidden } = useSelector((s: RootState) => s.windows[props.storeName]);

  return (
    <div className="flex justify-end pt-2">
      <button
        className="btn btn-sm btn-ghost rounded-none border-2 border-primary btn-square transition-colors hover:border-primary-focus hover:cursor-pointer right-2 relative"
        onClick={(ev) => props.onShowHideClick(ev)}
      >
        {!hidden ? "-" : "+"}
      </button>
      <button
        className="btn btn-sm btn-ghost rounded-none border-2 border-secondary btn-square hover:border-secondary-focus hover:cursor-pointer right-1 relative h-2"
        onClick={(ev) => props.onMoveToTopClick(ev)}
      >
        ↑
      </button>
    </div>
  );
};

export default HeaderBar;
