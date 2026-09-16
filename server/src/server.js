import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const app=express();
app.use(helmet());
app.use(cors({origin:process.env.CLIENT_ORIGIN||true}));
app.use(express.json({limit:'1mb'}));
app.use(morgan('dev'));
app.use(rateLimit({windowMs:15*60*1000,max:300}));

const userSchema=new mongoose.Schema({
 name:{type:String,required:true,trim:true,maxlength:120},
 email:{type:String,required:true,unique:true,lowercase:true,trim:true},
 passwordHash:{type:String,required:true},
 role:{type:String,enum:['user','technician','admin'],default:'user'}
},{timestamps:true});

const ticketSchema=new mongoose.Schema({
 title:{type:String,required:true,trim:true,maxlength:200},
 description:{type:String,required:true,trim:true,maxlength:5000},
 category:{type:String,default:'General',trim:true},
 priority:{type:String,enum:['low','medium','high','critical'],default:'medium'},
 status:{type:String,enum:['open','in_progress','resolved','closed'],default:'open'},
 requester:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
 assignedTo:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null}
},{timestamps:true});

const User=mongoose.model('User',userSchema);
const Ticket=mongoose.model('Ticket',ticketSchema);

const sign=u=>jwt.sign({id:u._id,email:u.email,role:u.role},process.env.JWT_SECRET,{expiresIn:'7d'});
function auth(req,res,next){
 const h=req.headers.authorization||'', token=h.startsWith('Bearer ')?h.slice(7):null;
 if(!token)return res.status(401).json({error:'Authentication required'});
 try{req.user=jwt.verify(token,process.env.JWT_SECRET);next();}
 catch{return res.status(401).json({error:'Invalid or expired token'});}
}
const asyncHandler=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);

app.get('/api/health',(req,res)=>res.json({ok:true,service:'it-service-desk'}));

app.post('/api/auth/register',asyncHandler(async(req,res)=>{
 const {name,email,password}=req.body??{};
 if(!name?.trim()||!email?.trim()||!password||password.length<8)
   return res.status(400).json({error:'Name, email and password (8+ characters) are required'});
 const exists=await User.findOne({email:email.trim().toLowerCase()});
 if(exists)return res.status(409).json({error:'Email already registered'});
 const u=await User.create({name,email:email.trim().toLowerCase(),passwordHash:await bcrypt.hash(password,12)});
 res.status(201).json({user:{id:u._id,name:u.name,email:u.email,role:u.role},token:sign(u)});
}));

app.post('/api/auth/login',asyncHandler(async(req,res)=>{
 const {email,password}=req.body??{};
 if(!email||!password)return res.status(400).json({error:'Email and password are required'});
 const u=await User.findOne({email:email.toLowerCase().trim()});
 if(!u||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({error:'Invalid credentials'});
 res.json({user:{id:u._id,name:u.name,email:u.email,role:u.role},token:sign(u)});
}));

app.get('/api/tickets',auth,asyncHandler(async(req,res)=>{
 const filter=['admin','technician'].includes(req.user.role)?{}:{requester:req.user.id};
 const data=await Ticket.find(filter).populate('requester','name email').populate('assignedTo','name email').sort({createdAt:-1});
 res.json(data);
}));

app.post('/api/tickets',auth,asyncHandler(async(req,res)=>{
 const {title,description,category='General',priority='medium'}=req.body??{};
 if(!title?.trim()||!description?.trim()||!['low','medium','high','critical'].includes(priority))
   return res.status(400).json({error:'Title, description and valid priority are required'});
 const t=await Ticket.create({title,description,category,priority,requester:req.user.id});
 res.status(201).json(t);
}));

app.patch('/api/tickets/:id/status',auth,asyncHandler(async(req,res)=>{
 const {status}=req.body??{};
 if(!['open','in_progress','resolved','closed'].includes(status))return res.status(400).json({error:'Invalid status'});
 const t=await Ticket.findByIdAndUpdate(req.params.id,{status},{new:true});
 if(!t)return res.status(404).json({error:'Ticket not found'});
 res.json(t);
}));

app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Internal server error'});});

const port=Number(process.env.PORT||3000);
mongoose.connect(process.env.MONGODB_URI).then(()=>app.listen(port,()=>console.log(`API on :${port}`)))
.catch(e=>{console.error('MongoDB connection failed',e);process.exit(1);});
