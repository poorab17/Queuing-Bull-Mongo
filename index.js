const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const redis =require("./redis");
const { sendNewEmail,emailQueue } =require("./mail/emailqueue");
const { createBullBoard } = require('bull-board')
const { BullAdapter } = require('bull-board/bullAdapter')
const path =require("path");
 const util = require("util");
const uri = "mongodb://0.0.0.0:27017/";


const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//app.use('/', routes);
const { router } = createBullBoard([new BullAdapter(emailQueue)]);
app.use('/admin/queues', router)

redis.set =util.promisify(redis.set);
redis.getAsync =util.promisify(redis.get);

mongoose.connect(uri+"bullDB");
console.log("connected");
const emailSchema = new mongoose.Schema(
 {
   name:{
    type:String,
    required:true
   },
   email:{
    type:String,
    required:true
   },
},
   {
    timestamps:true,
   }

);

const Email = mongoose.model("Email",emailSchema);
const user1 = new Email({
  name:"deep",
  email:"d@gmail.com"
})

const user2 = new Email({
  name:"deepa",
  email:"d@gmail.com"
})

const user3 = new Email({
  name:"deepak",
  email:"d@gmail.com"
})


const defaultitems=[user1,user2,user3];


app.get("/", async function(req, res) {
  try {
     let results;
    const cachedData = await redis.getAsync('Email');

    if (cachedData) {
      console.log('Data retrieved from Redis/cache');
      res.render("home", { listTitle: "today", newListItems: JSON.parse(cachedData)})
     
    } else {
       const results = await Email.find({});

      if (results.length === 0) {
        await Email.insertMany(defaultitems);
        
      }

      // Cache the data in Redis
      redis.setex('Email', 600, JSON.stringify(results));
      console.log('Data retrieved from MongoDB');
      res.render("home", { listTitle: "today", newListItems: results })
      //res.status(200).send(results);
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

app.post("/",async (req,res)=>{
  const {name,email} =req.body;
   const emailData = {
      from:"Deep'd@gmail.com",
      to: email,
      subject: 'Hello account activated',
      text: `Hello ${name}, this is a test email from your website.`,
    };
  Email.create({ name, email })
 .then((newEmail) => {
    console.log("Email inserted into MongoDB");
   // res.status(200).json({ status: "success", email: newEmail });
  })
  .catch((error) => {
    console.error("Error saving email to the database:", error);
    res.status(500).json({ status: "error", error: error.message });
  });
  
redis.del('Email', (err, reply) => {
        if (err) {
          console.error(err);
        } else {
          console.log('Redis cache for "Item" inserted');
        }
      }); 
       await sendNewEmail(emailData)
     res.render('sendAccountCreation', { name });

  });


app.post("/logout", (req, res) => {
  
  res.redirect("/");
});


app.post("/delete", async (req, res) => {
  try {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "today") {
      const deletedItem = await Email.findByIdAndRemove(checkedItemId);
      if (!deletedItem) {
        console.log("Item not found for deletion");
      } else {
        console.log("Deleted item:", deletedItem);
      }

      // Clear Redis cache for "Item" after item deletion
      redis.del('Email', (err, reply) => {
        if (err) {
          console.error(err);
        } else {
          console.log('Redis cache for "Item" deleted');
        }
      });

      res.redirect("/");
    } 
  }catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
   });




app.listen(5000, function() {
  console.log("Server started on port 5000");
});


module.exports=Email;