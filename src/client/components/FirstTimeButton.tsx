import React from "react";
import MyIconButton from "./MyIconButton";
import { PlayArrowOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useAudioContext } from "./Providers/AudioContextProvider";
import { useDispatch } from "react-redux";
import { handleDragStart } from "../redux/reducers/windowReducer";

type Props = {};

const buttonSx = { width: "50px", height: "50px" };
function FirstTimeButton({}: Props) {
    const audioContext = useAudioContext();
    const dispatch = useDispatch();

    const handleButtonClick = (ev: React.TouchEvent | React.MouseEvent) => {
        if (audioContext) {
            audioContext.runFirstTime(ev);
        }
    };

    return (
        <div
            onClick={() => dispatch(handleDragStart({ name: "main" }))}
            className="content-[''] bg-black z-50 absolute w-full h-full flex items-center justify-center flex-col"
        >
            <MyIconButton
                name="EnablePlayback"
                width={100}
                onClick={handleButtonClick}
            >
                <PlayArrowOutlined sx={buttonSx} />
            </MyIconButton>
            <a
                target="_blank"
                href="https://www.tenforums.com/tutorials/116467-allow-block-sites-play-sound-google-chrome.html#option4"
            >
                <Button sx={{ textDecoration: "underline" }}>
                    How To Disable Pop Up
                </Button>
            </a>
            <p>Please set Audio to Allow</p>
        </div>
    );
}

export default FirstTimeButton;
