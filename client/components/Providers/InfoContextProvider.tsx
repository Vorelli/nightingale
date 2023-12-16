import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

export type InfoContextState = {
	info: string | null;
};

const InfoContextStateContext = createContext<null | InfoContextState>(null);

interface Props {
	children: React.ReactNode;
}

export function useInfoContext() {
	return useContext(InfoContextStateContext);
}

export function InfoContextProvider({ children }: Props) {
	const { URL } = useSelector((s: RootState) => s.global);
	useEffect(() => {
		fetch(URL + "/api/info")
			.then((res) => res.json())
			.then((res) => setInfo(res.info))
			.catch((err) => console.error("Failed to fetch info.", err));
	}, []);

	const [info, setInfo] = useState<null | string>(null);
	return (
		<InfoContextStateContext.Provider
			value={{
				info,
			}}
		>
			{children}
		</InfoContextStateContext.Provider>
	);
}
