// mailer.js
const nodemailer = require('nodemailer')



var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user:  process.env.MAIL,
      pass:  process.env.PASSWORD
    }
  });

const sendMail =  async (email,subject,content)=>{
    try{
        var mailOptions ={
            from:process.env.MAIL,
            to: email,
            subject: subject,
            html:content
        };
      const info= await transporter.sendMail(mailOptions);
      console.log('Mail Sent :',info.messageId)
           
    }catch(error){
        console.log(error.message)
    }

}

module.exports={
    sendMail
}