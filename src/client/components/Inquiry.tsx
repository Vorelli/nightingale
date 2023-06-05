import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import DesktopWindow from "./DesktopWindow";

const Inquiry = () => {
    const [inProg, setInProg] = useState(false);
    const [success, setSuccess] = useState(false);
    const { URL } = useSelector((s: RootState) => s.global);
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [contact, setContact] = useState("");

    const { hidden } = useSelector(
        (s: RootState) => s.windows.windows["inquiry"]
    );

    function handleSubmit(ev: React.FormEvent) {
        if (ev.target instanceof HTMLFormElement) {
            setInProg(true);
            fetch(URL + "/api/inquiry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, message, contact })
            })
                .then((data) => data.json())
                .then((data) => {
                    if (data.message) {
                        setName("");
                        setContact("");
                        setMessage("");
                        setSuccess(true);
                        setTimeout(() => {
                            setSuccess(false);
                        }, 2500);
                    }
                })
                .catch((err) =>
                    console.log(
                        "error occurred when trying to send message",
                        err
                    )
                )
                .finally(() => setInProg(false));
            // send form data to API
            //  on success:
            //    clear form
            //    show success message for a few seconds and then allow user to send another inquiry
            //  on error:
            //    dont clear form
            //    popup error message to user
            //  while sending:
            //    disable inputs
        }
        ev.preventDefault();
    }

    return (
        <DesktopWindow
            storeName="inquiry"
            gridTemplate={hidden ? "50% 50%/1fr" : "10% 90%/1fr"}
            title="Inquiry"
            id="inquiry-player"
        >
            {(!hidden && (
                <div className="overflow-y-auto h-full relative col-span-2 m-2 mr-0">
                    {(success && (
                        <div className="absolute top-0 left-0 text-3xl font-bold right-0 bottom-0 flex justify-center items-center">
                            Inquiry sent successfully!
                        </div>
                    )) || (
                        <form
                            onSubmit={handleSubmit}
                            className="w-[80%] h-full space-y-2 flex justify-center flex-col items-center m-auto "
                        >
                            <h4>
                                Please utilize the form below to get in contact
                                with me and I'll get back to you ASAP. Thanks!
                            </h4>
                            <label htmlFor="name">
                                Email/Phone/Contact Method:
                            </label>
                            <input
                                type="text"
                                className={
                                    (inProg && "opacity-50 ") ||
                                    "" +
                                        "input input-bordered input-secondary w-full"
                                }
                                required={true}
                                disabled={inProg}
                                value={contact}
                                onChange={(ev) => setContact(ev.target.value)}
                                name="contact"
                            />
                            <label htmlFor="name">Name:</label>
                            <input
                                type="text"
                                className={
                                    (inProg && "opacity-50 ") ||
                                    "" +
                                        "input input-bordered input-secondary w-full"
                                }
                                required={true}
                                disabled={inProg}
                                value={name}
                                onChange={(ev) => setName(ev.target.value)}
                                name="name"
                            />
                            <label htmlFor="body">Message:</label>
                            <textarea
                                className={
                                    (inProg && "opacity-50 ") ||
                                    "" + "textarea textarea-secondary w-full"
                                }
                                name="body"
                                value={message}
                                onChange={(ev) => setMessage(ev.target.value)}
                                disabled={inProg}
                                required={true}
                            />
                            <button
                                disabled={inProg}
                                className={
                                    (inProg && "opacity-50 ") ||
                                    "" + "btn btn-secondary btn-lg"
                                }
                                type="submit"
                            >
                                Send Inquiry
                            </button>
                        </form>
                    )}
                </div>
            )) || <div>Expand to make an inquiry</div>}
            <div></div>
        </DesktopWindow>
    );
};

export default Inquiry;
