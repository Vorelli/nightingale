import React from "react";

type Props = {};

function FilterBar({}: Props) {
  return (
    <div className="flex w-full pt-2 space-x-1">
      <input
        className="flex-1 rounded-none xs-input input-primary overflow-hidden"
        type="text"
        placeholder="Search"
      ></input>
      <button className="btn btn-xs btn-ghost border-primary hover:border-primary-focus transition-all shadow-md active:shadow-secondary">
        ⚙️
      </button>
    </div>
  );
}

export default FilterBar;
