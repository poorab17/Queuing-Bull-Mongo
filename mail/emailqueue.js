const Bull = require("bull");
const emailProcess =require("./transporter")
const Job = require("bull");

const emailQueue = new Bull("email", {
    redis:{
         host: '127.0.0.1', 
         port: 6379,
       },
       limiter:{
        max:1000,
        duration:5000,
       }
})
 

emailQueue.process(emailProcess);

//const results = await Email.find({});
 // results.forEach((user,index)=>{
      // emailQueue.add({user}).then(()=>{
      //   if(index+1 ===user.length){
      //     res.json({
      //       message:"all user added"
      //     })
      //   }
      // })
      // })

const sendNewEmail =(data)=>{
    emailQueue.add(data,{
           attempts:10,
           priority:3
    })
     console.log('Job added to the queue:', data);
}
emailQueue.on('completed',(job)=>{
    console.log(`completed #${job.id} job`)
})

module.exports= {
    sendNewEmail,emailQueue
}