var mongoose = require('mongoose')
let secrets = require('secrets')
dbconf = secrets.mongodb
let uri = secrets.mongodb.uri
let options = { useUnifiedTopology: true, useNewUrlParser: true }
let node = mongoose.createConnection(uri, options)
Schema = mongoose.Schema;
moment = require('moment')
let write = true

var navSchema = new Schema({
    siteTitle: {
        type: String,
        required: true,
        unique: false
    },
    actions: {
        type: [{
            type: Schema.ObjectId,
            ref: 'navAction'
        }],
        default: []
    },
    actionGroups: {
        type: [{
            type: Schema.ObjectId,
            ref: 'navAction'
        }],
        default: []
    },
    // navLowerCase: {type: String, required: false, unique: true},
    arbData: {
        type: {},
        default: {}
    }
})
var navModel = node.model('nav', navSchema)

var navActionGroupSchema = new Schema({
    actions: { type: [{ type: Schema.ObjectId }], default: [] }
})
var navActionGroupModel = node.model('actionGroup', navActionGroupSchema)

var navActionSchema = new Schema({
    text: {
        type: String
    },
    icon: {
        type: String,
        default: null
    },
    render: {
        type: String,
        default: 'text'
    },
    type: {
        type: String,
        default: "link"
    },
    link: {
        type: String
    },
    action: {
        type: String
    },
    auth: {
        type: [String],
        default: ["general"]
    },
    src: {
        type: String
    }
})
var navActionModel = node.model('action', navActionSchema)



if (write) {
    navModel.remove({}, err => {
        if (err) {
            console.log(err)
        } else {
            // growtime nav generation
                // var navActionGroups = [
                //     [{
                //             text: "market",
                //             type: 'link',
                //             icon: 'bank',
                //             render: 'icon',
                //             link: '/market',
                //             auth: ["general"]
                //         },
                //         // {
                //         //     text: "forum",
                //         //     type: 'link',
                //         //     icon: 'group',
                //         //     render: 'icon',
                //         //     link: '/forum',
                //         //     auth: ["general"]
                //         // },
                //         {
                //             text: "realms",
                //             type: 'link',
                //             icon: 'connectdevelop',
                //             render: 'icon',
                //             link: '/realms',
                //             auth: ["general"]
                //         }
                //         // ]
                //         ,
                //         // [
                //         {
                //             text: "login-small",
                //             type: 'component',
                //             auth: ["nouser"]
                //         },
                //         {
                //             text: "connections",
                //             type: 'link',
                //             // icon: 'connectdevelop',
                //             icon: 'address-book',
                //             render: 'icon',
                //             link: '/connections',
                //             auth: ["user"]
                //         },
                //         {
                //             text: "notifications",
                //             type: 'link',
                //             icon: 'globe',
                //             render: 'icon',
                //             link: '/notifications',
                //             auth: ["user"]
                //         },
                //         {
                //             text: "self",
                //             type: 'dropdown',
                //             // icon: 'address-card-o',
                //             icon: '500px',
                //             render: 'icon',
                //             action: 'toggleSideBar',
                //             link: '/self',
                //             auth: ["user"]
                //         }
                //     ]
                // ]

                // var newNav = new navModel({
                //     siteTitle: 'growtime'
                // })
                // var actions = []
                // navActionModel.remove({}, err => {
                //     if (err) {
                //         console.log(err)
                //     } else {
                //         navActionGroups.forEach((actionGroup, index) => {
                //             var newActionGroup = new navActionGroupModel({
                //                 actions: []
                //             })
                //             for (var action of actionGroup) {
                //                 var newAction = new navActionModel(action)
                //                 newAction.save(err => {
                //                     if (err) {
                //                         console.error("there was an error saving")
                //                         console.error(err)
                //                     }
                //                     // else {
                //                     //     console.log("successfully saved")
                //                     // }
                //                 })
                //                 newActionGroup.actions.push(newAction._id)
                //             }
                //             newNav.actionGroups.push(newActionGroup)
                //             newActionGroup.save(err => {
                //                 if (err) {
                //                     console.error("there was an error saving")
                //                     console.error(err)
                //                 }
                //                 // else {
                //                 //     console.log("successfully saved")
                //                 // }
                //             })
                //         })
                //         newNav.save(err => {
                //             if (err) {
                //                 console.error("there was an error saving")
                //                 console.error(err)
                //             }
                //             // else {
                //             //     console.log("successfully saved")
                //             // }
                //         })
                //     }
                // })
                
            
            // planet express nav generation
                var navActionGroups = [
                    [
                        // {
                        //     text: "market",
                        //     type: 'link',
                        //     icon: 'bank',
                        //     render: 'icon',
                        //     link: '/market',
                        //     auth: ["general"]
                        // },
                        // {
                        //     text: "forum",
                        //     type: 'link',
                        //     icon: 'group',
                        //     render: 'icon',
                        //     link: '/forum',
                        //     auth: ["general"]
                        // },
                        // {
                        //     text: "realms",
                        //     type: 'link',
                        //     icon: 'connectdevelop',
                        //     render: 'icon',
                        //     link: '/realms',
                        //     auth: ["general"]
                        // },
                        // {
                        //     text: "login-small",
                        //     type: 'component',
                        //     auth: ["nouser"]
                        // },
                        // {
                        //     text: "connections",
                        //     type: 'link',
                        //     // icon: 'connectdevelop',
                        //     icon: 'address-book',
                        //     render: 'icon',
                        //     link: '/connections',
                        //     auth: ["user"]
                        // },
                        // {
                        //     text: "notifications",
                        //     type: 'link',
                        //     icon: 'globe',
                        //     render: 'icon',
                        //     link: '/notifications',
                        //     auth: ["user"]
                        // },
                        // {
                        //     text: "self",
                        //     type: 'dropdown',
                        //     // icon: 'address-card-o',
                        //     icon: '500px',
                        //     render: 'icon',
                        //     action: 'toggleSideBar',
                        //     link: '/self',
                        //     auth: ["user"]
                        // },
                        {
                            type: 'static',
                            src: '/assets/pe-logo.png',
                            render: 'img',
                            action: 'toggleSideBar',
                            link: '/self',
                            auth: ["user"]
                        }
                    ]
                ]
                var newNav = new navModel({
                    siteTitle: 'planet express'
                })
                var actions = []
                navActionModel.remove({}, err => {
                    if (err) {
                        console.log(err)
                    } else {
                        navActionGroups.forEach((actionGroup, index) => {
                            var newActionGroup = new navActionGroupModel({
                                actions: []
                            })
                            for (var action of actionGroup) {
                                var newAction = new navActionModel(action)
                                newAction.save(err => {
                                    if (err) {
                                        console.error("there was an error saving")
                                        console.error(err)
                                    }
                                    // else {
                                    //     console.log("successfully saved")
                                    // }
                                })
                                newActionGroup.actions.push(newAction._id)
                            }
                            newNav.actionGroups.push(newActionGroup)
                            newActionGroup.save(err => {
                                if (err) {
                                    console.error("there was an error saving")
                                    console.error(err)
                                }
                                // else {
                                //     console.log("successfully saved")
                                // }
                            })
                        })
                        newNav.save(err => {
                            if (err) {
                                console.error("there was an error saving")
                                console.error(err)
                            }
                            // else {
                            //     console.log("successfully saved")
                            // }
                        })
                    }
                })
        }
    })
}


module.exports = navModel