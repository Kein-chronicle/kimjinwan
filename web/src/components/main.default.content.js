import React from 'react'
import MainImg from '../assets/mainImg.png'

function MainDefaultContent() {
    const imgSize = {
        maxWidth: '100%'
    }
    const titleStyle = {
        padding: "20px"
    }
    const desStyle = {
        color:'gray',
        paddingBottom : '25px'
    }

    return (
        <div>
            <div style={titleStyle}>
                <h3>I am... uhm...</h3>
            </div>
            <div style={desStyle}>
                What is my job? <br />
                Every day, I type blar blar blar... <br />
                Am I a 'typer'? <br />
                Yes.. I'm a 'typer' <br />
                But my typing make something, so many thing. <br />
                Sometimes, make awsome & beautiful & helpful<br /><br />
                <h5>So I am a 'programmer'</h5>
                <br />
                Since 2016
            </div>
            
            <img style={imgSize} src={MainImg} alt="main-back" />
        </div>
    )
}

export default MainDefaultContent