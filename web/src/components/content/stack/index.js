import React from 'react'

function Stack() {
    const simpleLine = <div style={{width:'250px', height:'1px', backgroundColor:'white', display:'inline-block'}}></div>
    return (
        <div style={{paddingTop:'20px'}}>
            <div>
                I can ...
            </div>
            <div style={{color:'gray', paddingTop:'15px'}}>
                {simpleLine}
                <br />
                It is possible to make<br />
                <span style={{color:'white'}}>Linux web server</span>,<br />
                <span style={{color:'white'}}>Build & Set database</span>,<br />
                <span style={{color:'white'}}>Homepage</span>,<br />
                <span style={{color:'white'}}>Shopping mall</span>,<br />
                <span style={{color:'white'}}>Hybrid application</span>,<br />
                <span style={{color:'white'}}>Native ios application</span>,<br />
                <span style={{color:'white'}}>Erc-20 token build</span><br />
                by myself<br />
                {simpleLine}
            </div>
            <div style={{paddingTop:'5rem'}}>
                <h5>Details</h5>
            </div>
            <div className="container-sm">
                <div className="row" style={{margin:'0px'}}>
                    <div className="col-sm rounded-sm border border-white m-3 p-3">
                        <div style={{fontWeight:'bolder', marginBottom:'5px', color:'gray'}}>
                            Server Side
                        </div>
                        <div>
                            Linux<br />
                            AWS<br />
                            Docker<br />
                            NginX<br />
                            Apache2
                        </div>
                    </div>
                    <div className="col-sm rounded-sm border border-white m-3 p-3">
                        <div style={{fontWeight:'bolder', marginBottom:'5px', color:'gray'}}>
                            Database
                        </div>
                        <div>
                            Mongodb<br />
                            Mysql<br />
                            Redis<br />
                            AWS RDS
                        </div>
                    </div>
                    <div className="col-sm rounded-sm border border-white m-3 p-3">
                        <div style={{fontWeight:'bolder', marginBottom:'5px', color:'gray'}}>
                            Web publishing
                        </div>
                        <div>
                            HTML<br />
                            CSS<br />
                            Javascript<br />
                            Bootstrap
                        </div>
                    </div>
                </div>
                <div className="row" style={{margin:'0px'}}>
                    <div className="col-sm rounded-sm border border-white m-3 p-3">
                        <div style={{fontWeight:'bolder', marginBottom:'5px', color:'gray'}}>
                            Web front
                        </div>
                        <div>
                            React<br />
                            Angular<br />
                            Vue<br />
                            Ajex<br />
                            Jquery...
                        </div>
                    </div>
                    <div className="col-sm rounded-sm border border-white m-3 p-3">
                        <div style={{fontWeight:'bolder', marginBottom:'5px', color:'gray'}}>
                            Backend
                        </div>
                        <div>
                            PHP<br />
                            Node<br />
                            Python
                        </div>
                    </div>
                    <div className="col-sm rounded-sm border border-white m-3 p-3">
                        <div style={{fontWeight:'bolder', marginBottom:'5px', color:'gray'}}>
                            Etc
                        </div>
                        <div>
                            Swift<br />
                            Object-C<br />
                            SwiftUI<br />
                            Solidity
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default Stack