import React from 'react'
import { Switch, Route } from 'react-router'

import { UseSessionProvider } from 'react-session-hook'
import './css/main.css'

import Top from './top/top'

import MainDefault from './main.default.content'

import Intro from './content/intro'
import Stack from './content/stack'
import Histroy from './content/history'
import Service from './content/service'
import Blog from './content/blog'
import Idea from './content/idea'
import Contact from './content/contact'

import NotFound from './not.found'

import Admin from './admin'

function MainPage() {

    const wrapStyle = {
        paddingTop: "5rem",
        paddingBottom:'5rem' 
    }

    return (
        <div style={wrapStyle} className="text-center">
            <Top />
            <UseSessionProvider>
                <Switch>
                    <Route exact path="/admin/:sub?" component={Admin} />
                    <Route exact path="/intro" component={Intro} />
                    <Route exact path="/stack" component={Stack} />
                    <Route exact path="/history" component={Histroy} />
                    <Route exact path="/service" component={Service} />
                    <Route exact path="/blog/:sub?/:index?" component={Blog} />
                    <Route exact path="/idea" component={Idea} />
                    <Route exact path="/contact" component={Contact} />
                    <Route exact path="/" component={MainDefault} />
                    <Route path="/" component={NotFound} />
                </Switch>
            </UseSessionProvider>
        </div>
    )
}

export default MainPage