import React from 'react'
import { Link } from 'react-router-dom'

function notFound() {
    const wrapStyle = {
        paddingTop: "5rem"
    }
    const desStyle = {
        paddingTop: '3rem',
        paddingBottom: '1rem',
        color:'gray'
    }
    return (
        <div style={wrapStyle} className="text-center">
            <h1>404 Not Found</h1>
            <div style={desStyle}>
                <h5>
                    You can't enter this page.<br />
                    Please enter other page...
                </h5>
            </div>
            <Link to="/">Go home</Link>
            <div style={desStyle}>
                {/* Create by Kein chronicle */}
            </div>
        </div>
    )
}

export default notFound