import React from "react";

interface Props {
	info: string;
}

const PersonalInfo = ({ info }: Props) => {
	return (
		<div className="w-full" dangerouslySetInnerHTML={{ __html: info }}></div>
	);
};

export default PersonalInfo;
