import React, { useEffect, useState } from "react"
import useSession from 'react-session-hook';
import JwtDecode from 'jwt-decode';
import StackGrid from "react-stack-grid";

function ListController() {
    return (
        <div>you ar admin</div>
    )
}

function ListPage() {

    const session = useSession()
    const userInfo = JwtDecode(session.token)
    const [admin, setAdmin] = useState(false)
    useEffect(()=>{
        if (session.token === undefined || userInfo.admin === false) {
            window.location = "/"
        } else {
            setAdmin(true)
        }
    }, [session.token, userInfo.admin])

    return (
        <div>
            {admin ? <ListController /> : null}
            <StackGrid
            columnWidth={150}
            >
            <div key="key1">
                <img alt="key1img" style={{width:'150px', height:'200px'}} src="https://797ib1mbyf481ftl3rimdn3x-wpengine.netdna-ssl.com/wp-content/uploads/2014/04/shutterstock_11016667944-300x231.jpg" />
            </div>
            </StackGrid>
        </div>
    )
}

export default ListPage