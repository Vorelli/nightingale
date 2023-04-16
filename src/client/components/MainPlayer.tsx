import React from "react";
import DesktopWindow from "./DesktopWindow";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import LeftDesktopPanel from "./LeftDesktopPanel";
import RightDesktopPanel from "./RightDesktopPanel";
import { toggleHidden, toggleOnTop } from "../redux/reducers/windowReducer";
import BottomDesktopPanel from "./BottomDesktopPanel";

type Props = {};

function MainPlayer({}: Props) {
  const windowName = "main";
  const { hidden } = useSelector((s: RootState) => s.windows[windowName]);

  return (
    <DesktopWindow
      icon={"/icon.png"}
      title={"Nightingale Playing <anim> The Mountain Goats - Tallahassee - No Children"}
      storeName={windowName}
      toggleHidden={toggleHidden}
      toggleOnTop={toggleOnTop}
    >
      {[
        !hidden ? (
          <div className="w-full h-[90%] flex flex-col">
            <section className="w-full flex-1 flex h-full" key={1}>
              <LeftDesktopPanel></LeftDesktopPanel>
              <RightDesktopPanel></RightDesktopPanel>
            </section>
            <BottomDesktopPanel></BottomDesktopPanel>
          </div>
        ) : (
          <footer key={2} className="w-full h-10">
            Here is the footer
          </footer>
        ),
      ]}
    </DesktopWindow>
  );
}

export default MainPlayer;
