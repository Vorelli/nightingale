import { createSignal, createEffect } from "solid-js";

const App = () => {
  const [count, setCount] = createSignal(0);

  createEffect(() => {
    console.log("Count:", count());
  });
  console.log("hello");

  return (
    <div>
      <h1>Hello World!</h1>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </div>
  );
};

export default App;
