import React from "react"
import { NavLink, Link } from 'react-router-dom'
import { useSelector } from 'react-redux';

function Top() {

    const show = useSelector(state => state.dataStore)

    const wrapStyle = {
        paddingTop: "5rem",
        display : show.showTops ? "block" : "none"
    }

    const bottomGap = {
        marginBottom: '3rem'
    }
    

    return (
        <div style={bottomGap} >
            <Link to="/">
                <h1 className="title">Kein Chronicle's Homepage</h1>
            </Link>
            <div className="container" style={wrapStyle}>
                <div className="row nav">
                    <div className="col-sm">
                        <NavLink to="/intro">
                            <div className="navBtn">Intro</div>
                        </NavLink>
                    </div>
                    <div className="col-sm">
                        <NavLink to="/stack">
                            <div className="navBtn">Stack</div>
                        </NavLink>
                    </div>
                    <div className="col-sm">
                        <NavLink to="/history">
                            <div className="navBtn">History</div>
                        </NavLink>
                    </div>
                    {/* <div className="col-sm">
                        <NavLink to="/service">
                            <div className="navBtn">Service</div>
                        </NavLink>
                    </div> */}
                    {/* <div className="col-sm">
                        <NavLink to="/idea">
                            <div className="navBtn">Idea Note</div>
                        </NavLink>
                    </div> */}
                    {/* <div className="col-sm">
                        <NavLink to="/blog/list">
                            <div className="navBtn">Blog</div>
                        </NavLink>
                    </div> */}
                    <div className="col-sm">
                        <NavLink to="/contact">
                            <div className="navBtn">Contact</div>
                        </NavLink>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Top