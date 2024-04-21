const mongoose = require('mongoose');

const connect = mongoose.connect(process.env.atlasUri)

connect.then(() => {
    console.log("database connected")
})
    .catch((error) => {
        console.log(error)
        console.log("database not connected")
    })

module.exports = connect;