const express=require('express')
const connection=require('../connection')
const router=express.Router();
let ejs=require('ejs');
let pdf=require('html-pdf');
let path=require('path');
var fs=require('fs');
var uuid=require('uuid');

var auth=require('../services/authentication');


router.post('/generateReport', auth.authenticateToken,(req,res)=>{
    const generatedUuid=uuid.v1();
    
    const orderDetails=req.body;
    let productDetailsReport=JSON.parse(orderDetails.productDetails);
    let query="insert into bill (name,uuid,email,contactNumber,paymentMethod,total,productDetails,createdBy) values(?,?,?,?,?,?,?,?)";
    connection.query(query,[orderDetails.name,generatedUuid,orderDetails.email,orderDetails.contactNumber,orderDetails.paymentMethod,orderDetails.totalAmount,orderDetails.productDetails,res.locals.email],(err,results)=>{
        if(!err){
            ejs.renderFile(path.join(__dirname,'',"report.ejs"),{productDetails:productDetailsReport,name:orderDetails.name,email:orderDetails.email,contactNumber:orderDetails.contactNumber,paymentMethod:orderDetails.paymentMethod,totalAmount:orderDetails.totalAmount},(err,results)=>{
                if(err){
                   // "productDetails":"[{\"id\": 1, \"name\": \"Black coffee\", \"price\": 99, \"total\": 99, \"category\": \"coffeee\", \"quantity\": \"1\" }]"
                        return res.status(500).json(err);

                }
                else{
                    pdf.create(results).toFile('./generated_pdf'+generatedUuid+".pdf",function(err,data){
                        if(err){
                            console.log(err);
                            return res.status(500).json(err);
                        }
                        else{
                            return res.status(200).json({uuid: generatedUuid}); 
                        }
                    }) 
                }
            })
        }
        else{
            return res.status(500).json(err);
        }
    })
})


router.post('/getPdf',auth.authenticateToken,function(req,res){
    const orderDetails=req.body;
    const pdfPath='./generated_pdf/ '+orderDetails.uuid+'.pdf';
    if(fs.existsSync(pdfPath))
    {
        res.contentType("application/pdf");
        fs.createReadStream(pdfPath).pipe(res);
    }
    else{
        var productDetailsReport=JSON.parse(orderDetails.productDetails);
        ejs.renderFile(path.join(__dirname,'',"report.ejs"),{productDetails:productDetailsReport,name:orderDetails.name,email:orderDetails.email,contactNumber:orderDetails.contactNumber,paymentMethod:orderDetails.paymentMethod,totalAmount:orderDetails.totalAmount},(err,results)=>{
            if(err){
                    return res.status(500).json(err);

            }
            else{
                pdf.create(results).tofile('./generated_pdf'+orderDetails.uuid+".pdf",function(err,data){
                    if(err){
                        console.log(err);
                        return res.status(500).json(err);
                    }
                    else{
                        res.contentType("application/pdf");
                        fs.createReadStream(pdfPath).pipe(res);
                    }
                }) 
            }
        })
    }
})

router.get('/getBills',auth.authenticateToken,(req,res,next)=>{
    
    query="select * from bill order by DESC";
    connection.query(query,(err,results)=>{
        if(!err)
        {
                return res.status(200).json(results);

        }
        else{
            return res.status(500).json(err);
        }
    })
})


router.delete('/delete/:id',auth.authenticateToken,(req,res,next)=>{
    const id=req.params.id;
    var query="delete from product where id=?";
    connection.query(query,[id],(err,results)=>{
        if(!err)
        {
            if(results.affectedRows==0)
            {
                return res.status(404).json({message:"product id does not found"});

            }
            return res.status(200).json({message:"product deleted success"});   

        }
        else{
            return res.status(500).json(err);
        }
    })
})





module.exports=router;