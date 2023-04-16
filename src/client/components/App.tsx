import React, { useState, useEffect } from "react";
import Desktop from "./Desktop";
import { useDispatch } from "react-redux";
import { songsRequest, songsRequestSuccess } from "../redux/reducers/songsReducer";

const App = () => {
  const [count, setCount] = useState(0);
  const dispatch = useDispatch();
  const URL = "https://toscanonatale.dev";

  useEffect(() => {
    dispatch(songsRequest());
    fetch(URL + "/api/songs")
      .then((data) => data.json())
      .then((data) => {
        console.log("data from server", data);
        dispatch(songsRequestSuccess(data));
      });
  }, []);

  useEffect(() => {
    console.log("Count:", count);
  });
  console.log("hello");

  return <Desktop />;
};

export default App;
