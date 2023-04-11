import { JSX } from "solid-js";

declare global {
  export namespace JSX {
    interface IntrinsicElements {
      [k: string]: any;
    }
  }
}
