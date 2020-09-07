import express from "express"
import mongoose from "mongoose"
import Messages from "./dbMessages.js"
import Pusher from "pusher"
import cors from "cors"

const app = express();
const port = process.env.PORT || 9000
app.use(express.urlencoded());
app.use (express.json())

app.use(cors())



const conection_url = "mongodb+srv://admin:JPKfIQcim7zkVIIV@cluster0.mwgc9.mongodb.net/whatsappdb?retryWrites=true&w=majority";

const pusher = new Pusher({
    appId: '1068026',
    key: 'c7ea87ec1d368aeb7df8',
    secret: 'd0a07d9914a0b645ebfc',
    cluster: 'us2',
    useTLS: true
  });



mongoose.connect(conection_url,{
    useCreateIndex : true,
    useNewUrlParser: true,
    useUnifiedTopology: true
}); 

const db = mongoose.connection
db.once("open",()=>{
    console.log("BD Conected")    
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();
    
    changeStream.on("change",(change)=>{
        console.log(change);
        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted",{
                name : messageDetails.name,
                message : messageDetails.message,
                timestamp : messageDetails.timestamp,
                received : messageDetails.received,
            });
        }else{
            console.log("error triggering Pusher")
        }
    })
});

app.get("/", (req, res) => res.status(200).send("hello word"));

app.get("/messages/sync", (req, res)=>{
    Messages.find((err,data)=>{
        if (err) {
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

app.post("/messages/new",  (req, res) =>{
    const dbMessage = req.body;    
console.log(dbMessage)
    Messages.create (dbMessage, (err,data)=>{
        if (err) {
            res.status(500).err
        }else{
            res.status(201).send("OK"+ data)
        }
    })

})



app.listen(port, ()=>console.log("Listening on localhost: ", port));

