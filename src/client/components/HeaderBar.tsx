import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const HeaderBar = (props: {
    onShowHideClick: Function;
    onMoveToTopClick: Function;
    storeName: string;
}) => {
    const { hidden } = useSelector(
        (s: RootState) => s.windows.windows[props.storeName]
    );

    return (
        <div className="flex notHeader justify-end pt-2 space-x-1 [&>*]:pointer-events-auto">
            <button
                className="btn btn-sm btn-ghost rounded-none border-2 border-primary btn-square transition-colors hover:border-primary-focus hover:cursor-pointer relative"
                onClick={(ev) => props.onShowHideClick(ev)}
            >
                {!hidden ? "-" : "+"}
            </button>
            <button
                className="btn btn-sm btn-ghost rounded-none border-2 border-secondary btn-square hover:border-secondary-focus hover:cursor-pointer relative h-2"
                onClick={(ev) => props.onMoveToTopClick(ev)}
            >
                ↑
            </button>
        </div>
    );
};

export default HeaderBar;
