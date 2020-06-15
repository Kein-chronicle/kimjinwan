import React, { useEffect } from "react"
import useSession from 'react-session-hook';
import JwtDecode from 'jwt-decode';

function ControllPage() {

    const session = useSession()
    const userInfo = JwtDecode(session.token)
    useEffect(()=>{
        if (session.token === undefined || userInfo.admin === false) {
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