import Veterinario from "../models/Veterinario.js";
import generarJWT from "../helpers/generarJWT.js";
import generarId from "../helpers/generarId.js";
import emailRegistro from "../helpers/emailRegistro.js";
import emailOlvidePassword from "../helpers/emailOlvidePassword.js";

const registrar = async (req, res) => {
    const { email, nombre } = req.body;

    // Prevenir usuarios duplicados
    const existeUsuario = await Veterinario.findOne({email});

    if(existeUsuario){
        const error = new Error('Usuario ya registrado');
        return res.status(400).json({ msg:error.message })
        //console.log(existeUsuario);
    }

    try{
        // Guardar un Nuevo Veterinario
        const veterinario = new Veterinario(req.body);
        const veterinarioGuardado = await veterinario.save();
        //res.json({ msg: "Registrando usuario..." });
        
        // Enviar el email
        emailRegistro({
            email,
            nombre,
            token: veterinarioGuardado.token
        });

        res.json(veterinarioGuardado);

    } catch (error) {
        console.log(error);
    }

    /*  console.log(req.body);
        console.log(email);
        console.log(password);
        console.log(nombre);    */

};

const perfil = (req,res) => {
    const { veterinario } = req;
    //console.log(req.veterinario);
    //res.json({ msg: "Mostrando Perfil" });
    //res.json({ perfil: veterinario });
    res.json({ veterinario });
};

const confirmar = async (req, res) => {
    const { token } = req.params
    const usuarioConfirmar = await Veterinario.findOne({token});

    if(!usuarioConfirmar) {
        const error = new Error('Token no válido')
        return res.status(404).json({msg : error.message})
    }

    try {
        usuarioConfirmar.token = null;
        usuarioConfirmar.confirmado = true;
        await usuarioConfirmar.save()

        res.json({msg : 'Usuario Confirmado Correctamente'});
    } catch (error) {
        console.log(error);
    }

    //console.log(req.params.token);
    //console.log(usuarioConfirmar);  
};

const autenticar = async (req, res) => {
   // console.log(req.body);
    const { email, password } = req.body                // Formulario
    // Comprobar si el usuario existe
    const usuario = await Veterinario.findOne({ email })
    /*if(usuario) {
        console.log('Si existe ...');
        res.json({ msg: 'Autenticando' });
    } else {
        res.status(403).json({ msg: "El Usuario no existe" });
    }*/
    if(!usuario) {
        const error = new Error('El Usuario no existe')
        return res.status(404).json({ msg : error.message })
    }
    // Comprobar si el usuario esta confirmado
    if(!usuario.confirmado) {
        const error = new Error("Tu Cuenta no ha sido confirmada");
        return res.status(403).json({ msg: error.message });
    }

    // Revisar el password
    if( await usuario.comprobarPassword(password) ){
        //console.log("Password correcto");
        //console.log(usuario);
        // Autenticar
        //usuario.token = generarJWT(usuario.id)
        //res.json({ token: generarJWT(usuario.id) });
        //res.json(usuario);
        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            //telefono: usuario.telefono,
            telefono: usuario.telefono,
            //web : usuario.web,
            web : usuario.web,
            token: generarJWT(usuario.id),
        });
    } else {
        console.log("Password incorrecto");
        const error = new Error("El Password es incorrecto");
        return res.status(403).json({ msg: error.message });
    }

};

const olvidePassword = async (req, res) => {
    const {email} = req.body;
    const existeVeterinario = await Veterinario.findOne({email});
    // console.log(email);
    //console.log(existeVeterinario);
    if(!existeVeterinario) {
        const error = new Error("El Usuario no existe");
        return res.status(400).json({msg: error.message});
    }

    try {
        existeVeterinario.token = generarId()
        await existeVeterinario.save();
        
        // Enviar Email con instrucciones
        emailOlvidePassword({
            email,
            nombre: existeVeterinario.nombre,
            token: existeVeterinario.token
        })

        res.json({ msg: "Hemos enviado un email con las instrucciones" });
    } catch (error) {
        console.log(error);
    }
}

const comprobarToken = async (req, res) => {
    const { token } = req.params;            // URL 
  //  console.log(token);
  const tokenValido = await Veterinario.findOne({ token });

  if(tokenValido){
    // El Token es válido, el usuario existe
    res.json({ msg: "Token válido y el usuario existe" });
  } else {
    const error = new Error('Token no válido');
    return res.status(400).json({ msg: error.message });
  }

}

const nuevoPassword = async (req, res) => {

    const { token } = req.params;       // URL
    console.log(token);
    const { password } = req.body;      // Lo que el usuario escriba.

    const veterinario = await Veterinario.findOne({ token })

    if(!veterinario) {
        const error = new Error('Hubo un error');
        return res.status(400).json({ msg: error.message });
    }

    try {
        //console.log(veterinario);
        veterinario.token = null;
        veterinario.password = password;
        await veterinario.save();
        res.json({ msg:"Password modificado correctamente" });

    } catch (error) {
        console.log(error);
    }

};

const actualizarPerfil = async (req, res) => {
    // console.log(req.params.id)
    // console.log(req.body)
    // encontrar el veterinario que estamos editando.
    const veterinario = await Veterinario.findById(req.params.id);
    if(!veterinario){
        const error = new Error("Hubo un error");
        return res.status(400).json({ msg : error.message });
    }

    const { email } = req.body
    // Significa que el usuario está modificando el email, cambia el que tenía por uno nuevo
    if (veterinario.email !== req.body.email) {
        // Comprobación
        const existeEmail = await Veterinario.findOne({email})
        // Si existe es que ya está registrado.
        if(existeEmail){
            const error = new Error("Ese email ya está en uso");
            return res.status(400).json({ msg : error.message });
        }
    }

    try {
        // Si en el req no hay nada, asigna lo que ya este en la base de datos.
        //veterinario.nombre = req.body.nombre || veterinario.nombre;
        veterinario.nombre = req.body.nombre; 
        veterinario.email = req.body.email;
        veterinario.web = req.body.web;
        veterinario.telefono = req.body.telefono;

        const veterinarioActualizado = await veterinario.save()
        res.json(veterinarioActualizado);
        // Una vez se presione en guardar cambios y obtenga una respuesta correcta, se sincroniza el state
        // de Auth con la respuesta que venga de la base de datos, esos van a ser los datos del servidor, de
        // esa forma van a estar sincronizados el backend con nuestro state. 
    } catch (error) {
        console.log(error)
    }
};

const actualizarPassword = async (req, res) => {
    // console.log(req.veterinario);
    // console.log(req.body);

    // Leer los datos
    const { id } = req.veterinario;
    const { pwd_actual, pwd_nuevo } = req.body;
 
    // Comprobar que el veterinario existe
    const veterinario = await Veterinario.findById(id);
    if(!veterinario){
        const error = new Error("Hubo un error");
        return res.status(400).json({ msg : error.message });
    }

    // Comprobar su password
    if(await veterinario.comprobarPassword(pwd_actual)){
        // console.log('Correcto')
        // Almacenar el nuevo password
        veterinario.password = pwd_nuevo;
        await veterinario.save();
        res.json({ msg: "Password Almacenado Correctamente" });
    } else {
        // console.log('Incorrecto')
        const error = new Error("El Password Actual es Incorrecto");
        return res.status(400).json({ msg : error.message });
    }

};

export { registrar, 
         perfil, 
         confirmar, 
         autenticar, 
         olvidePassword, 
         comprobarToken, 
         nuevoPassword,
         actualizarPerfil,
         actualizarPassword
        };