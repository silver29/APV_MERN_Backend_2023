import jwt from 'jsonwebtoken';
import Veterinario from '../models/Veterinario.js';

const checkAuth = async (req, res, next) => {
    let token;
    //console.log(req.headers.authorization);
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        console.log('Si tiene el token con bearer');
        try {
            //console.log(req.headers.authorization);
            token = req.headers.authorization.split(" ")[1];
            //console.log(token);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            //console.log(decoded);
            //  req.veterinario = await Veterinario.findById(decoded.id);
            /* const veterinario = await Veterinario.findById(decoded.id).select(
                "-password -token -confirmado"
            );*/
            req.veterinario = await Veterinario.findById(decoded.id).select(
                "-password -token -confirmado"
            );
            
            // console.log(veterinario);
            //console.log(req.veterinario);
            // salta al siguiente middleware
            return next(); 

        } catch (error) {
            const e = new Error("Token no Válido");
            return res.status(403).json({ msg: e.message });
        }

    } /*else{
        console.log('No no hay token o bearer');
    } */
    if(!token){
        const error = new Error("Token no Válido o inexistente");
        res.status(403).json({ msg: error.message });
    }
    
    //console.log("Desde mi Middleware");
    // a perfil
    next(); 
};

export default checkAuth;