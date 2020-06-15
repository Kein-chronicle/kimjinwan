import React from 'react'
import Kecle from '../../../assets/kecle.jpeg'

function Intro() {
    const imageStyle = {
        width: "250px"
    }
    return (
        <div>
            <div style={{paddingTop:'20px'}}>
                <img style={imageStyle} src={Kecle} alt="profile"/>
            </div>
            <div style={{paddingTop:"10px"}}>
                <div>
                    Korean : 김진완
                </div>
                <div>
                    English : Kim Kein Chronicle
                </div>
                <div style={{color:'gray'}}>
                    <div style={{paddingTop:"10px"}}>
                        Born in Seocheon, Korea
                    </div>
                    <div>
                        Major in psychology & marketting
                    </div>
                    <div>
                        My job is a programmer
                    </div>
                    <div>
                        Now I live in Seongnam, Korea
                    </div>
                    <div>
                        {/* Work in M2S+(<a href="www.m2skorea.com" target="_blank">www.m2skorea.com</a>) */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Intro