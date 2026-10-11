import User from '../models/user.js';
 import Restaurant from '../models/resturant.js';
import { issueRefresh, signAccess } from '../utils/token.js';
import { verifyWithLockout } from '../utils/lockout.js';
  
  const publicUser =  (u) =>({
     id : u._id , name :u.name , role : u.role ,  restaurantId : u.restaurantId , mustChangePin , 
  }) ; 
   const  invalid =  (res) => res.status(401).json({message : 'Invalid credentials'}) ;
    const unauthorized =  (res) =>  res.status(401).json({message :  'Unauthorized'})
      

     async function  startSession(user ,res) {
         await issueRefresh( user , res)
          
          res.json({accessToken : signAccess(user) , user : publicUser(user)}) ;
     } 
      
     const resturantIsActive = (id) => Restaurant.exists({ id :  id , isActive : true}) ;
      
  //admin/login
   export  const  adminLogin =  asyncHandler(async(req , res) =>{
     const{email ,  password }=  req.body 
     const user= await  User.findOne({email , role: 'admin' , isActive : true}) ;
      if(!(await  verifyWithLockout(user , User.checkPassword , password))) return invalid(res) ;
       if(!(await resturantIsActive(user.restaurantId))) return unauthorized(res) ;
     
        await  startSession(user,res)
   })
      // cashier/login
       export  const cashierLogin  =  asyncHandler(async(req ,res) =>{
          const {restaurantCode ,  username ,pin} = req.body
           const restaurant =  await  Restaurant.findOne({code : restaurantCode , isActive : true}) ;
            const user =  restaurant ?  await  User.findOne({restaurantId : restaurant._id , username , role : 'cashier' , isActive : true}).select('+pinHash') : null ;
           if(!(await  verifyWithLockout (user ,  checkPin ,   pin))) return invalid(res) ;
            await  startSession(user,res) 
       })   
        
       //   refresh token    // rotatates  the token also lets  the frontend    reload  a session 
       export  const refreshToken =  asyncHandler(async(req , res) =>{
         const  raw  =  readRefreshCookie(req)
          if(!raw)
             return  unauthorized(res) ; 
        
        const  doc =  await  RefreshToken.findOne({ tokenHash : sha256(raw)})
         if(!doc) return  unauthorized(res) ;
          if (doc.revokedAt){
            await RefreshToken.updateMany({ family: doc.family }, { revokedAt: new Date() });
    console.warn('refresh token reuse detected for user', String(doc.userId));
    return unauthorized(res);
     
          }
            if (doc.expiresAt < new Date()) return unauthorized(res);

  const user = await User.findOne({ _id: doc.userId, isActive: true });
  if (!user || !(await restaurantIsActive(user.restaurantId))) return unauthorized(res);

  doc.revokedAt = new Date();
  await doc.save();
  await issueRefresh(user, res, doc.family);
  res.json({ accessToken: signAccess(user), user: publicUser(user) });
}); 
 // POST /api/auth/logout (this device)
export const logout = asyncHandler(async (req, res) => {
  const raw = readRefreshCookie(req);
  if (raw) await RefreshToken.updateOne({ tokenHash: sha256(raw) }, { revokedAt: new Date() });
  clearRefreshCookie(res);
  res.json({ ok: true });
});

// POST /api/auth/logout-all (every device)
export const logoutAll = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
  await revokeAllForUser(req.user.id);
  clearRefreshCookie(res);
  res.json({ ok: true });
});

// POST /api/auth/unlock (cashier re-enters PIN after the idle lock)
export const unlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+pinHash');
  if (!(await verifyWithLockout(user, checkPin, req.body.pin))) return invalid(res);
  res.json({ ok: true });
});

// POST /api/auth/change-pin (cashier; also clears mustChangePin)
export const changePin = asyncHandler(async (req, res) => {
  const { currentPin, newPin } = req.body;

  const user = await User.findById(req.user.id).select('+pinHash');
  if (!(await verifyWithLockout(user, checkPin, currentPin))) return invalid(res);

  user.pinHash = await hashPin(newPin);
  user.mustChangePin = false;
  user.tokenVersion += 1;            // old sessions die
  await user.save();
  await revokeAllForUser(user._id);
  await startSession(user, res);     // this device gets a fresh session
});

// POST /api/auth/change-password (admin)
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!(await verifyWithLockout(user, checkPassword, currentPassword))) return invalid(res);

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1;
  await user.save();
  await revokeAllForUser(user._id);
  await startSession(user, res);
});