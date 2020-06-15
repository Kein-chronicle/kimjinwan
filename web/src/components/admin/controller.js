import React, { useEffect } from "react"
import useSession from 'react-session-hook';

function ControllPage() {

    const session = useSession()
    useEffect(()=>{
        if (session.token === undefined) {
            window.location = "/"
        }
    })

    return (
        <div>
            Controll page
        </div>
    )
}

export default ControllPage