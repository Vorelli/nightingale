import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

export type ResumeContextState = {
    resume: Uint8Array | null;
    personal: string | null;
    name: string | null;
};

const ResumeContextStateContext = createContext<null | ResumeContextState>(
    null
);

interface Props {
    children: React.ReactNode;
}

export function useResumeContext() {
    return useContext(ResumeContextStateContext);
}

export function ResumeContextProvider({ children }: Props) {
    const { URL } = useSelector((s: RootState) => s.global);
    const [resume, setResume] = useState<null | Uint8Array>(null);
    const [personal, setPersonal] = useState<string | null>(null);
    const [name, setName] = useState<null | string>(null);

    useEffect(() => {
        fetch(URL + "/api/resume")
            .then((res) => res.json())
            .then((res) => {
                setResume(res.resume);
                setPersonal(res.personal.data);
                setName(res.personal.name);
            })
            .catch((err) => console.error("Failed to fetch info.", err));
    }, []);

    return (
        <ResumeContextStateContext.Provider
            value={{
                personal,
                resume,
                name
            }}
        >
            {children}
        </ResumeContextStateContext.Provider>
    );
}
