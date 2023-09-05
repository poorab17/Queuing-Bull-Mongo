
const nodemailer=require("nodemailer");
const Job = require("bull");

const emailProcess = async (job)=>{
 console.log('Processing job:', job.data);
    if(job.attemptsMade>2){
        throw new Error(`server is down`)
    }
    let testAccount = await nodemailer.createTestAccount();

    
  var transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'gavin60@ethereal.email',
        pass: 'KF3YNwyGp91dyM8ZN5'
    },
 secure: false,
  tls:{
    rejectUnauthorized:false,
     ciphers: 'TLS_AES_128_GCM_SHA256',
    minVersion: 'TLSv1.2'
  }
});
transporter.verify((error,success)=>{
    if(error){
        console.log(error);
    }else{
      console.log("mail server is running");
    }
})

    console.log(job.data);
    const info = await transporter.sendMail(job.data);
    const testMessageUrl = nodemailer.getTestMessageUrl(info);

  console.log("Message sent: %s", info.messageId);
  console.log("Test message URL: ", testMessageUrl);
  return testMessageUrl;

}


//export default emailProcess;
module.exports=emailProcess;