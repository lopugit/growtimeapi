var conf = {
    siteTitle: "growtimeapi",
    port: 9998,
    sources: [
        { 
            source: 'facebook',
            edges: ["likes", "sharedposts", "attachments", "reactions", "comments"]
        }
    ],
    hardRealms: ['all']
}
module.exports = conf