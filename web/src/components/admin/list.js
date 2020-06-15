import React, { useEffect } from "react"
import useSession from 'react-session-hook';

function ListPage() {

    const session = useSession()
    useEffect(()=>{
        if (session.token === undefined) {
            window.location = "/"
        }
    })

    return (
        <div>
            list page
        </div>
    )
}

export default ListPage