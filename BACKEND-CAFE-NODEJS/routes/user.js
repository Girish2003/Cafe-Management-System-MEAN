const express=require('express');
const connection=require('../connection');
const router=express.Router();
const app = express();
// require('crypto').randomBytes(64).toString('hex')

const jwt=require('jsonwebtoken');
const nodemailer=require('nodemailer');
require('dotenv').config();

var auth=require('../services/authentication');
var checkRole=require('../services/checkRole');

// app.get('/',()=>{
//     console.log("HIII")
// })
// router.get('/',()=>{
//     console.log("Got0");
// })
router.post('/signup',(req,res)=>{
    let user=req.body;
    query="select email,password,role,status from user where email=?"
    connection.query(query,[user.email],(err,results)=>{
        if(!err)
        {
            if(results.length<=0)
            {
                query="insert into user(name,contactNumber,email,password,status,role) values(?,?,?,?,'false','user')";

                connection.query(query,[user.name,user.contactNumber,user.email,user.password],(err,results)=>{
                    if(!err){
                        return res.status(200).json({message:"Successful registation"});
                    }
                    else
                    {
                        return res.status(500).json(err);
                    }
                })
            }
            else{
                return res.status(400).json({message:"email already exist"});
            }
        }
        else
        {
            return res.status(500).json(err);
            
        }
    })
})



router.post('/login',(req,res)=>{
    const user=req.body;
    query="select email,password,role,status from user where email=?";
    connection.query(query,[user.email],(err,results)=>{
        if(!err)
        {
            if(results.length<=0||results[0].password!=user.password)
            {
                return res.status(401).json({message:"Incorrec username or password"});
            }
            else if(results[0].status==='false')
            {
                return res.status(401).json({message:"wait for admin approval"});
            }
            else if(results[0].password==user.password)
            {
                const response={email:results[0].email,role:results[0].role}
                const accessToken=jwt.sign(response,process.env.ACCESS_TOKEN,{expiresIn:'8h'})
                res.status(200).json({token:accessToken});
                
            }
            else{
                return res.status(400).json({message:"something went wrong pls try later"})
            }

        }
        else
        {
            return res.status(500).json(err);
        }
    })
})



var transporter =nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.EMAIL,
        pass:process.env.PASSWORD,
    }
})

router.post('/forgetPassword',(req,res)=>{
    const user=req.body;
    query="select email,password from user where email=?";
    connection.query(query,[user.email],(err,results)=>{
        if(!err)
        {
            if(results.length<=0)
            {
                return res.status(200).json({message:"password sent successfully to mail"});
            }
            else
            {
                var mailOptions={
                    from:process.env.EMAIL,
                    to:results[0].email,
                    subject:'password by cafe mgt system',
                    html:'<p><b>your login details for cafe mgt system</b><br><b>Email: </b>'+results[0].email+'<br><b>password:</b>'+results[0].password+'<br><a href="http://localhost:4200/">click more to login</p>'

                };
                transporter.sendMail(mailOptions,function(error,info){
                    if(error)
                    {
                        console.log(error);
                    }
                    else{
                        console.log('Email sent:'+info.response);
                    }
                });
                return res.status(200).json({message:"password sent successfully to mail"})
            }

        }
        else
        {
            return res.status(500).json(err);
        }
    })
})

router.get('/get',auth.authenticateToken,(req,res)=>{
    var query="select id,name,email,contactNumber,status from user where role='user'";
    connection.query(query,(err,results)=>{
        if(!err)
        {
            return res.status(200).json(results);
        }
        else
        {
            return res.status(500).json(err);
        }
    })
})


router.patch('/update',auth.authenticateToken,(req,res)=>{
    let user=req.body;
    var query="update user set status=? where id=?";
    connection.query(query,[user.status,user.id],(err,results)=>{
        if(!err)
        {
                if(results.affectedRows==0)
                {
                    return res.status(404).json({message:"user id does not exist"});
                }
                return res.status(200).json({message:"user updated succesfully"});

        }
        else{
            return res.status(500).json(err);
        }
    })
})


router.get('/checkToken',auth.authenticateToken,(req,res)=>{
    return res.status(200).json({message:"true"});
})


module.exports=router;
