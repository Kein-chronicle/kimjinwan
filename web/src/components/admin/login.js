import React, { useState } from "react"

function LoginPage() {
    const [password, setPassword] = useState("")

    const login = () => {
        if (password === "wlsdhks2@@") {
            console.log("login complete");
            
        }
    }

    return (
        <div className="d-flex">
            <div className="flex-grow-1"></div>
            <div>
                <input type="password" onChange={(e)=>{setPassword(e.target.value)}} style={{width:'100px'}} className="form-control" />
                <br />
                <button className="btn btn-secondary" onClick={()=>login()} >로그인</button>
            </div>
            <div className="flex-grow-1"></div>
        </div>
    )
}

export default LoginPage