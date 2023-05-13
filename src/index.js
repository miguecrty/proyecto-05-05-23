import express from "express";
import morgan from "morgan";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from 'pg';
import fs from 'fs';
//import snmp from 'snmp-native';
import snmp from 'net-snmp'
import snmp_nat from 'snmp-native'
import session from 'express-session';
import bodyParser from 'body-parser';
import pdf from 'pdf-lib';

// Routes
import indexRoutes from "./routes/index.js";
import { TIMEOUT } from "dns";

// Initialize express
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
// settings
app.set("port", process.env.PORT || 3000);
app.set("views", join(__dirname, "views"));
app.set("view engine", "ejs");

// middlewares
app.use(morgan("dev"));

// routes
app.use(indexRoutes);

app.use(express.static(join(__dirname,'public')))

// listening the Server


console.log("Servidor en el puerto", app.get("port"));

app.listen(app.get("port"));
/////////////////////////// BBDD //////////////////////////////////////////////


let ip_juanma="192.168.1.164";
let ip_migue="192.168.1.145";
//let ip_rafa="192.168.0.161";


let ips = [ip_migue,ip_juanma];
let cpu_nucleos = [];

const pool = new pg.Pool({
  user: 'postgres',
  host: 'trabajogestion.crowks977whm.eu-west-3.rds.amazonaws.com',
  database: 'dbgestion',
  password: '0mrZcu1Yr7ftZwSGPK5j',
  port: 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error adquiriendo cliente', err.stack)
  }
  console.log('Conexión exitosa a PostgreSQL');
});

const sqlFilePath = 'src/public/sql/tablasGestion.sql';


fs.readFile(sqlFilePath, 'utf8', (err, sqlQuery) => {
  if (err) {
    console.error(err);
    return;
  }


  

  
  pool.connect();
  pool.query(sqlQuery, (err, res) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Archivo tablasGestion.sql cargado.');

      
      for(let i=0;i<ips.length;i++)
      {
        pool.query("INSERT INTO pcs VALUES("+(i+1)+",'-','-','"+ips[i]+"','-','-',0,0,false)", (error, results) => {
          if (error)
          {
           console.log("Error insertando pcs")
          } 
        });
        let oid_ifIndex = ["1.3.6.1.2.1.4.20.1.2."+ips[i]];
        insertarIfindex(oid_ifIndex,ips[i]);

        let oid_syscontact = ["1.3.6.1.2.1.1.4.0"];
        insertarsyscontact(oid_syscontact,ips[i]);

        let oid_sysname = ["1.3.6.1.2.1.1.5.0"];
        insertarsysname(oid_sysname,ips[i]);
  
        let oid_syslocation = ["1.3.6.1.2.1.1.6.0"];
        insertarsyslocation(oid_syslocation,ips[i]);

        let oid_nucleos = [1,3,6,1,2,1,25,3,3,1]; // OID para hrProcessorEntry
        insertarNucleos(ips[i],oid_nucleos);

        let oid_pos_inicio = ["1.3.6.1.2.1.25.3.3.1.1"];
        insertarPosicionInicioNucleos(ips[i],oid_pos_inicio,i);

    }
  }


  
  ////////////////////// Si existe algun fallo SNMP o de insertar en BBDD ////////////////////////////////
  let exito;
 let compruebasnmp = setInterval(function() { 
  if ( exito != true)
  {
    pool.query('SELECT * FROM pcs', (error, results) => {
      if(error) console.log("ERROR");
      for(let i=0;i<results.rows.length;i++)
      {

      if(results.rows[i].syscontact == '-')
      {
        pool.query("SELECT ip FROM pcs WHERE syscontact='-'", (error, results) => {
          for(let i=0;i<results.rows.length;i++){
            let oid_syscontact = ["1.3.6.1.2.1.1.4.0"];
            let ip = (results.rows[i]).ip;
          insertarsyscontact(oid_syscontact,ip);
      }
    });
     }
      if(results.rows[i].syslocation == '-')
      {
        pool.query("SELECT ip FROM pcs WHERE syslocation='-'", (error, results) => {
          for(let i=0;i<results.rows.length;i++){
          let oid_syslocation = ["1.3.6.1.2.1.1.6.0"];
          let ip = (results.rows[i]).ip;
          insertarsyslocation(oid_syslocation,ip);
          }
       });
      }  
      if(results.rows[i].sys_name == '-')
      {
        pool.query("SELECT ip FROM pcs WHERE sys_name='-'", (error, results) => {
          for(let i=0;i<results.rows.length;i++){
          let oid_sysname = ["1.3.6.1.2.1.1.5.0"];
          let ip = (results.rows[i]).ip;
          insertarsysname(oid_sysname,ip);
          }
       });
     }
      if(results.rows[i].ifindex == '0')
      { 
        pool.query("SELECT ip FROM pcs WHERE ifindex='"+0+"'", (error, results) => {
          for(let i=0;i<results.rows.length;i++){
            let ip = (results.rows[i]).ip;
            let oid_ifIndex = ["1.3.6.1.2.1.4.20.1.2."+ip];
          insertarIfindex(oid_ifIndex,ip);
          }
        });
      }

      if(results.rows[i].numcpu == 0)
      { 
        pool.query("SELECT ip FROM pcs WHERE numcpu='"+0+"'", (error, results) => {
          for(let i=0;i<results.rows.length;i++){
            let ip = (results.rows[i]).ip;
            let oid_nucleos = [1,3,6,1,2,1,25,3,3,1]; // OID para hrProcessorEntry
             insertarNucleos(ip,oid_nucleos);
          }
        });
      }
    }
    for(let i = 0; i< results.rows.length;i++)
    {
      if(results.rows[i].syscontact == "-" || results.rows[i].ifindex == "-" || results.rows[i].numcpu == "-" || results.rows[i].sys_name == "-" || results.rows[i].syslocation == "-" || cpu_nucleos[i] == "" || results.rows[i].numcpu == 0 )
      {
        exito = false;
      console.log("Error al insertar en la ip: "+results.rows[i].ip+" \n Reintentando...")
      }
      else{
        exito = true;
      }
    }
    
  });
}
else{
        clearInterval(compruebasnmp);
        console.log("---------------------------------------------------");
        console.log("TODOS LOS EQUIPOS HAN SIDO INSERTADOS CORRECTAMENTE");
        console.log("---------------------------------------------------");
}
  }, 3000);
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////

///////////////INSERTAMOS EN LA BBDD///////////////////////////
function insertarsyslocation(oid_syslocation,ip){
  var session = snmp.createSession(ip, "public",{timeout : 5000});
  session.get(oid_syslocation, function(error, varbinds) {
    if (error) {
      console.log("Error peticion SNMP syslocation a la ip: "+ip);
      insertarsyslocation(oid_syslocation,ip);
    } else 
    {
      const syslocation = varbinds[0].value.toString();
      console.log("Insertando a la BBDD syslocation:"+syslocation+" a la ip="+ip);
    
      pool.query("UPDATE pcs SET syslocation ='"+syslocation+"'"+" WHERE ip ='"+ip+"'", (error, results) => {
        if (error)
        {
          console.log("Error syslocation")
        }
        
      }); 
    }
    });

}
function insertarsyscontact(oid_syscontact,ip){
  var session = snmp.createSession(ip, "public",{timeout : 5000});
  session.get(oid_syscontact, function(error, varbinds) {
    if (error) {
      console.log("Error peticion SNMP syscontact a la ip: "+ip);
      insertarsyscontact(oid_syscontact,ip);
    } else 
    {
      const syscontact = varbinds[0].value.toString();
      console.log("Insertando a la BBDD syscontact:"+syscontact+" a la ip="+ip);
      pool.query("UPDATE pcs SET syscontact ='"+syscontact+"'"+" WHERE ip ='"+ip+"'", (error, results) => {
        if (error)
        {
          insertarsyscontact(oid_syscontact,ip);
        }
      });
    }
    });
}
function insertarsysname(oid_sysname,ip){
  var session = snmp.createSession(ip, "public", {timeout : 5000});
  session.get(oid_sysname, function(error, varbinds) {
    if (error) {
      console.log("Error peticion SNMP sysname a la ip: "+ip);
      insertarsysname(oid_sysname,ip);
    } else 
    {
      let imagen = "";
      const sysname = varbinds[0].value.toString();
      console.log("Insertando a la BBDD sysname:"+sysname+" a la ip="+ip);
      if(sysname == "Windows 10")
      {
        imagen = "../imagenes/windows10.png";
        pool.query("UPDATE pcs SET sys_name='"+sysname+"', img='"+imagen+"' WHERE ip ='"+ip+"'", (error, results) => {
          if (error)
        {
          insertarsysname(oid_sysname,ip);
        }
        });
      }
      if(sysname == "Windows 11")
      {
        imagen ="../imagenes/windows11.png";
        pool.query("UPDATE pcs SET sys_name='"+sysname+"', img='"+imagen+"' WHERE ip ='"+ip+"'", (error, results) => {
          if (error) 
          {
            insertarsysname(oid_sysname,ip);
          }
        });
      }
     
    }
    });
}
function insertarIfindex(oid_ifIndex,ip){
  var session = snmp.createSession(ip, "public", {timeout : 5000});
  session.get(oid_ifIndex, function(error, varbinds) {
    if (error) {
      console.log("Error peticion SNMP ifindex a la ip: "+ip);
    } else 
    {
      const ifindex = varbinds[0].value.toString();
      console.log("Insertando a la BBDD ifIndex:"+ifindex+" a la ip="+ip);
      pool.query("UPDATE pcs SET ifindex ="+ifindex+" WHERE ip ='"+ip+"'", (error, results) => {
        if (error)
        {
          console.log("Error en insertar ifindex")
          insertarIfindex(oid_ifIndex,ip);
        }
      });
    }
    });
}

function insertarNucleos(ip,oid){
  const session1 = new snmp_nat.Session({
    host: ip,
    community: 'public'
  });
  session1.getSubtree({ oid }, (error, varbinds) => {
    if (error) {
      console.log("Error peticion SNMP num_cpu a la ip: "+ip);
    } else {
      let num_cpu = varbinds.length/2;
      pool.query("UPDATE pcs SET numcpu ="+num_cpu+" WHERE ip ='"+ip+"'", (error, results) => {
        if (error)
        {
          console.log("Error Nucleos")
        }
                  pool.query("SELECT * FROM pcs", (error, results) => {
                    if (error)
                    {
                      console.log("Error Nucleos")
                    }
                    for(let i=0;i<results.rows.length;i++)
                    {
                    //console.log(results.rows[i]);
                    }
                });
    });
  }
});
}
  function insertarPosicionInicioNucleos(ip,oid,posicion){
  var session = snmp.createSession(ip, "public", {timeout : 5000});
  session.getNext(oid, function(error, varbinds) {
    if (error) {
      console.log("Error peticion SNMP num_cpu a la ip: "+ip);
    } else 
    {
      const nextOid = varbinds[0].oid;
     
      const numeroInicioCPU = nextOid.split('.').pop();
      cpu_nucleos[posicion] = numeroInicioCPU;
    }
    });

}
///////////////////////////////////////////////////////////////////////////////

/////////////////////////// LOGIN //////////////////////////////////////////////
// Configurar la sesión


app.use(session({
  secret: 'secreto',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Solo enviar la cookie a través de HTTP
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Middleware para verificar la sesión del usuario
function requireLogin(req, res, next) {
  if (req.session && req.session.userId) {
    // Si el usuario está autenticado, continuar con la siguiente ruta
    next();
  } else {
    // Si el usuario no está autenticado, redirigir al inicio de sesión
    res.redirect('/login');
  }
}
app.get('/login', (req, res) => {
  
  res.render('login', { mensaje: "" });
});

app.post('/compruebalogin', (req, res) => {
  const nombre = req.body.username;
  const clave = req.body.password;

  pool.query('SELECT * FROM usuarios WHERE nombre=\''+nombre+'\' AND clave=\''+clave+'\'', (error, results) => {
    if(results.rows.length > 0)
    {
      req.session.userId = nombre;
      res.redirect('/');
    }
    else
    {
      const mensaje = "Usuario y/o clave no son correctos";
      res.render('login', { mensaje: mensaje });
    }
  });

});

app.post('/logout', (req, res) => {
  // Eliminar el id de usuario de la sesión
  req.session.destroy();
  res.redirect('/login');
});

///////////////////////////////////////////////////////////////////////////////
const precio_pc=5;
const precio_internet=3;
const unitarioTiempo=0.05;
const unitariog1=0.01;
const unitariog2=0.02;
const unitariog3=0.1;
const unitariog4=0.25
const unitariog5=0.1;
const unitariog6=0.1;


let estado_pcs = [];
let equipos;
let alquiladores = [];
let tiempoeq = [];
const TOTAL_EQUIPOS=ips.length;

let facturas = [];
let facturag1 = {};
let facturag2 = {};
let facturag3 = {};
let facturag4 = {};
let facturag5 = {};
let facturag6 = {};

let valorg1eq=[];
let valorg2eq=[];
let valorg3eq=[];
let valorg4eq=[];
let valorg5eq=[];
let valorg6eq=[];

let ifInOctets=[];
let ifOutOctets=[];
let hrRestante_aux = [];

let g1aux = [];
let g2aux = [];
let g3aux = [];
let g4aux = [];
let g5aux = [];
let g6aux = [];
let tiempoaux = []; 
for (let i = 1; i <= TOTAL_EQUIPOS; i++) {
  valorg1eq[i]= [0];
  valorg2eq[i]= [0];
  valorg3eq[i]= [0];
  valorg4eq[i]= [0];
  valorg5eq[i]= [0];
  valorg6eq[i]= [0];
}

app.get('/consulta', requireLogin, (req, res) => {
  pool.query('SELECT * FROM pcs where estado=\'t\'', (error, results) => {
    if (error) {
      throw error;
    }
    if(results.rows.length > 0){
    res.render('consulta',{pcs : results.rows});
    }
    else 
    {
      res.redirect('/')
    }
    
  });
});
app.get('/actualizar', (req, res) => {
  pool.query('SELECT * FROM pcs where estado=\'t\'', (error, results) => {
    if (error) {
      throw error;
    }
    res.send(results.rows);
  });

});


app.get('/data', (req, res) => {
  const now = new Date().getTime();
  const data = {
    labels: [now.toString()],
    datasets: [{
      label: 'Valor',
      data: [Math.random() * 100],
      fill: false,
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }]
  };
  res.json(data);
});


function actualizagraficas(g1,g2,g3,g4,g5,g6,id,ip,ifindex,numCPU){
  let cpu = [];
  for (let i=0; i<numCPU;i++){
    let valor = parseInt(cpu_nucleos[id-1])+i
  let cpu$i = "1.3.6.1.2.1.25.3.3.1.2."+valor;
  cpu.push(cpu$i);
  }
  let ifOctets = ["1.3.6.1.2.1.2.2.1.10."+ifindex,"1.3.6.1.2.1.2.2.1.16."+ifindex];
  let ram = ["1.3.6.1.2.1.25.2.2.0", "1.3.6.1.2.1.25.2.3.1.6.4"];

  let oids =
   {
    "cpu":cpu,
    "ifOctets":ifOctets,
    "ram":ram
    };
//Para la RAM
function KbytesToGB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}
function bytesToGB(bytes) {
  return (bytes * 65536 /(1024*1024*1024)).toFixed(2);
}


  var session = snmp.createSession(ip, "public");
session.get(oids.ifOctets, function(error, varbinds) {
        if (error) {
            console.error(error);
        } else {
          
            for (var i = 0; i < varbinds.length; i++) {
                if (snmp.isVarbindError(varbinds[i])) {
                    console.error(snmp.varbindError(varbinds[i]));
                }
            }
            let if_octets = {"ifInOctets":+varbinds[0].value,"ifOutOctets":+varbinds[1].value};
            let ifInOctetsMB = if_octets.ifInOctets/1000000;
            let ifOutOctetsMB = if_octets.ifOutOctets/1000000;
            
            if(ifInOctets[id] == null){
            ifInOctets[id] = ifInOctetsMB;
            }
            if(ifOutOctets[id] == null){
              ifOutOctets[id] = ifOutOctetsMB;
              }

            let valorSNMPIfInOctects = ifInOctetsMB-ifInOctets[id];
            let valorSNMPIfOutOctects = ifOutOctetsMB-ifOutOctets[id];
            g1.push((valorSNMPIfInOctects).toFixed(2));
            g2.push((valorSNMPIfOutOctects).toFixed(2));
            if(valorSNMPIfInOctects > 100)
                {
                facturag1[id].penalizacion.push("5000Mbs de bajada superados");
                facturag1[id].tiempo.push(tiempoeq[id][tiempoeq[id].length-1]);
                }
            if(valorSNMPIfOutOctects > 100)
                {
                  facturag2[id].penalizacion.push("5000Mbs de subida superados");
                  facturag2[id].tiempo.push(tiempoeq[id][tiempoeq[id].length-1]);
                }
        }
      });
      
        session.get(oids.ram, function(error, varbinds) {
              if (error) {
                  console.error(error);
              } else {
                  for (var i = 0; i < varbinds.length; i++) {
                      if (snmp.isVarbindError(varbinds[i])) {
                          console.error(snmp.varbindError(varbinds[i]));
                      }        
                  }
                          const ramTotalKB = varbinds[0].value;
                          const ramTotal = KbytesToGB(ramTotalKB);
                          const ramUsadaBytes = varbinds[1].value;
                          let ramUsada = bytesToGB(ramUsadaBytes);
                          ramUsada=(ramUsada*100/ramTotal).toFixed(2);
                          let ramNoUsada = (100-ramUsada).toFixed(2);
                          let valoresRAM = [parseFloat(ramUsada),parseFloat(ramNoUsada)];
                          g3.push(valoresRAM);
                          if(ramUsada > 65)
                          {
                            facturag3[id].penalizacion.push("RamUsada mayor que 30");
                            facturag3[id].tiempo.push(tiempoeq[id][tiempoeq[id].length-1]);
                          }
              }
      });
      
        const oids_cpu = oids.cpu.slice(0, numCPU);
    
        session.get(oids_cpu, function(error, varbinds) {
                if (error) {
                    console.error(error);
                } else {
                  let cargaCPU = [];
                    for (var i = 0; i < numCPU; i++) {
                        if (snmp.isVarbindError(varbinds[i])) {
                            console.error(snmp.varbindError(varbinds[i]));
                        } else {
                           let cpu$i = varbinds[i].value;
                            cargaCPU.push(cpu$i);
                            if(cpu$i > 30)
                            {
                              facturag4[id].penalizacion.push("Cpu"+i+" ha sobrepasado 30%");
                              facturag4[id].tiempo.push(tiempoeq[id][tiempoeq[id].length-1]);
                            }
                        }
                    }
                    g4.push(cargaCPU);
                     }
        });
       const oid_numprocesos = ["1.3.6.1.2.1.25.1.6.0"];
        session.get(oid_numprocesos, function(error, varbinds) {
          if (error) {
              console.error(error);
          } else {
                  if (snmp.isVarbindError(varbinds[0])) {
                      console.error(snmp.varbindError(varbinds[0]));
                  } else {
                     let num_procesos = varbinds[0].value;
                     if(g5[0] == 0)
                     {
                      g5[0]=num_procesos;
                     }
                     g5.push(num_procesos);

                     if(num_procesos > 250)
                          {
                            facturag5[id].penalizacion.push("Numero de procesos mayores que 250");
                            facturag5[id].tiempo.push(tiempoeq[id][tiempoeq[id].length-1]);
                          }
                  }
               }
      });
      const oid_memoriadiscototal = "1.3.6.1.2.1.25.2.3.1.5.1"; //hrStorageSize
      const oid_memoriadiscousada = "1.3.6.1.2.1.25.2.3.1.6.1"; //hrStorageUsed
      const oid_storage = [oid_memoriadiscototal,oid_memoriadiscousada];
        session.get(oid_storage, function(error, varbinds) {
          if (error) {
              console.error(error);
          } else {
            for (var i = 0; i < varbinds.length; i++) {
              if (snmp.isVarbindError(varbinds[i])) {
                  console.error(snmp.varbindError(varbinds[i]));
                   }        
                 }
                      const hrTotalAllocationUnits = varbinds[0].value;
                      let hrTotalMB = ((hrTotalAllocationUnits*4096)/(1024*1024)).toFixed(2);
                      
                      const hrUsedAllocationUnits = varbinds[1].value;
                      let hrUsedMB = ((hrUsedAllocationUnits*4096)/(1024*1024)).toFixed(2);
                      hrTotalMB = parseFloat(hrTotalMB);
                      hrUsedMB = parseFloat(hrUsedMB);
                      let hrRestante = (hrTotalMB-hrUsedMB).toFixed(2);
                      if(hrRestante_aux[id] == null){
                        hrRestante_aux[id] = hrRestante;
                        }
                        let valorMedirStorage = (hrRestante_aux[id]-hrRestante).toFixed(2);
                        g6.push(valorMedirStorage);
                      if( valorMedirStorage > 50)
                          {
                            facturag6[id].penalizacion.push("Espacio de disco superado");
                            facturag6[id].tiempo.push(tiempoeq[id][tiempoeq[id].length-1]);
                          }
                  
               
              }
      });    
}



///Creamos acumuladores de tiempo para las graficas
function agregarHora(tiempo) {
  let horaActual = new Date().toLocaleTimeString();
  tiempo.push(horaActual);
}

for(let i = 1; i<= TOTAL_EQUIPOS; i++){
let intervalo_$i =setInterval(function() { 
  if(tiempoeq[i] != null)
  {
  agregarHora(tiempoeq[i]);
  pool.query('SELECT * FROM pcs where id='+i, (error, results) => {
    if (error) {
      throw error;
    }
    let ip = results.rows[0].ip;
    let ifindex =results.rows[0].ifindex;
    let numCPU = results.rows[0].numcpu;
    actualizagraficas(valorg1eq[i],valorg2eq[i],valorg3eq[i],valorg4eq[i],valorg5eq[i],valorg6eq[i],i,ip,ifindex,numCPU);
  });

  }
}, 5000);
}

app.get('/iniciarsnmp', (req, res) => {
  const equipo = req.query.equipo;
  const nombre = req.query.nombre;
  alquiladores[equipo]=nombre;
  

  if(valorg1eq[equipo] == null)
  {
    valorg1eq[equipo] = [0];
  }
  facturas[equipo] = [];
  facturag1[equipo] = {"penalizacion":[],"tiempo":[]};
  facturag2[equipo] = {"penalizacion":[],"tiempo":[]};
  facturag3[equipo] = {"penalizacion":[],"tiempo":[]};
  facturag4[equipo] = {"penalizacion":[],"tiempo":[]};
  facturag5[equipo] = {"penalizacion":[],"tiempo":[]};
  facturag6[equipo] = {"penalizacion":[],"tiempo":[]};
  let activo;
  let valores;
  let estado="exito";
  pool.query('UPDATE pcs SET estado = true WHERE id='+equipo, (error, results) => {
    if (error) {
      estado="error";
      throw error;
    }
    else{
  let horaActual = new Date().toLocaleTimeString();
  if(!tiempoeq[equipo]){
    tiempoeq[equipo] = [];
  }
  tiempoeq[equipo].push(horaActual);
  activo = true;
}
});


valores = {"estado": ''+estado+''};
  res.send(valores);
});

app.get('/prueba', (req, res) => {
  pool.query('SELECT * FROM pcs where estado=\'t\'', (error, results) => {
    if (error) {
      throw error;
    }
    res.render('prueba',{pcs : results.rows});
    
  });
});

app.get('/detenersnmp', (req, res) => {
  const equipo = req.query.equipo;
  let valores;
  let estado="exito";
  pool.query('UPDATE pcs SET estado = false WHERE id='+equipo, (error, results) => {
    if (error) {
      estado="error";
      throw error;
    }
    g1aux[equipo] = valorg1eq[equipo];
    g2aux[equipo] = valorg2eq[equipo];
    g3aux[equipo] = valorg3eq[equipo];
    g4aux[equipo] = valorg4eq[equipo];
    g5aux[equipo] = valorg5eq[equipo];
    g6aux[equipo] = valorg6eq[equipo];
    tiempoaux[equipo] = tiempoeq[equipo];

    
});



valores = {"estado": ''+estado+''};
  res.send(valores);
});

app.get('/actualizargraficas', (req, res) => {
  const equipo = req.query.id;
  let valores = [];  
  valores = {
    "valorg1": valorg1eq[equipo],
  "valorg2": valorg2eq[equipo],
  "valorg3": valorg3eq[equipo],
  "valorg4": valorg4eq[equipo],
  "valorg5": valorg5eq[equipo],
  "valorg6": valorg6eq[equipo],
   "tiempo": tiempoeq[equipo] 
  };
res.json(valores);
});
app.get('/muestratiempo', (req, res) => {
  const equipo = req.query.id; 
  let tiempoinicial = tiempoeq[equipo][0];
  let tiempofinal =tiempoeq[equipo][tiempoeq[equipo].length-1];
  let tiempoISegundos = ((tiempoinicial.split(':')[0] * 60) + Number(tiempoinicial.split(':')[1])) * 60 + Number(tiempoinicial.split(':')[2]);
  let tiempoFSegundos = ((tiempofinal.split(':')[0] * 60) + Number(tiempofinal.split(':')[1])) * 60 + Number(tiempofinal.split(':')[2]);
  let valortiempo = tiempoFSegundos-tiempoISegundos;
  let tiempo = {
    "tiempo":+valortiempo
  };
res.json(tiempo);
});


app.get('/',requireLogin,(req, res) => {
  for(let i=1;i<= TOTAL_EQUIPOS;i++){
  console.log("Persona que ha alquilado el equipo"+i+ "   "+alquiladores[i]);
  } 
   pool.query('SELECT * FROM pcs ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error;
    }
    equipos = results.rows;
    res.render('index',{pcs : equipos});
  });

});

app.get('/factura',requireLogin,(req, res) => {
  const equipo = req.query.id;
  //console.log(alquiladores[equipo],facturag1[equipo],facturag2[equipo],facturag3[equipo],facturag4[equipo],facturag5[equipo],facturag6[equipo]);
  

let tiempoinicial = tiempoaux[equipo][0];
let tiempofinal =tiempoaux[equipo][tiempoaux[equipo].length-1];

// Convertir tiempos a segundos
let tiempoISegundos = ((tiempoinicial.split(':')[0] * 60) + Number(tiempoinicial.split(':')[1])) * 60 + Number(tiempoinicial.split(':')[2]);
let tiempoFSegundos = ((tiempofinal.split(':')[0] * 60) + Number(tiempofinal.split(':')[1])) * 60 + Number(tiempofinal.split(':')[2]);
let num_factura=0;
 //////////////////////////////Para obtener la fecha y la hora////////////////////////////////////////////////
 const currentDate = new Date();
 const formattedDate = currentDate.toLocaleDateString();
 const formattedTime = currentDate.toLocaleTimeString();
 const fechaFormateada = `${formattedDate} - ${formattedTime}`;



// Calcular diferencia en segundos
let tiempo_uso = tiempoFSegundos - tiempoISegundos;
tiempo_uso = parseInt(tiempo_uso);
let coste_tu = 0.05*tiempo_uso;
let coste_tu_aux = coste_tu.toFixed(2);

pool.query('SELECT * FROM facturas', (error, results) => {
  if (error) {
    throw error;
  }
  num_factura=results.rows.length+1;


let valores = {
      "fecha":fechaFormateada,
      "equipo":+equipo,
      "tiempo_uso":+tiempo_uso,
      "coste_tu":+coste_tu_aux,
      "cliente":alquiladores[equipo],
      "num_factura":+num_factura
}
let factura_final = {
  "factura1":+facturag1[equipo].penalizacion.length,
  "factura2":+facturag2[equipo].penalizacion.length,
  "factura3":+facturag3[equipo].penalizacion.length,
  "factura4":+facturag4[equipo].penalizacion.length,
  "factura5":+facturag5[equipo].penalizacion.length,
  "factura6":+facturag6[equipo].penalizacion.length
}

    
let ponderacion_fija=5+3;//El equipo costaría por usarlo como precio fijo 5 euros y la fibra 3 euros.
let ponderacion_penalizacion1=facturag1[equipo].penalizacion.length*unitariog1;
let ponderacion_penalizacion2=facturag2[equipo].penalizacion.length*unitariog2;
let ponderacion_penalizacion3=facturag3[equipo].penalizacion.length*unitariog3;
let ponderacion_penalizacion4=facturag4[equipo].penalizacion.length*unitariog4;
let ponderacion_penalizacion5=facturag5[equipo].penalizacion.length*unitariog5;
let ponderacion_penalizacion6=facturag6[equipo].penalizacion.length*unitariog6;

let total=coste_tu + ponderacion_fija + ponderacion_penalizacion1 + ponderacion_penalizacion2 + ponderacion_penalizacion3 + ponderacion_penalizacion4 + ponderacion_penalizacion5 + ponderacion_penalizacion6;
let ponderaciones = {
  "penalizacion1":+ponderacion_penalizacion1.toFixed(2),
  "penalizacion2":+ponderacion_penalizacion2.toFixed(2),
  "penalizacion3":+ponderacion_penalizacion3.toFixed(2),
  "penalizacion4":+ponderacion_penalizacion4.toFixed(2),
  "penalizacion5":+ponderacion_penalizacion5.toFixed(2),
  "penalizacion6":+ponderacion_penalizacion6.toFixed(2),
  "total":+total.toFixed(2)
}
 

let unitarios = {
  "precio_pc":+precio_pc,
  "precio_internet":precio_internet,
  "unitarioTiempo":unitarioTiempo,
  "unitario1":+unitariog1,
  "unitario2":+unitariog2,
  "unitario3":+unitariog3,
  "unitario4":+unitariog4,
  "unitario5":+unitariog5,
  "unitario6":+unitariog6
}


const query = {
  text: 'INSERT INTO facturas (id,id_pcs, coste_t, nombre, fecha_y_hora) VALUES ($1 , $2, $3, $4, $5) RETURNING id',
  values: [num_factura,equipo ,ponderaciones.total, valores.cliente, fechaFormateada],
};
pool.query(query, (err, result) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Factura guardada correctamente');
    let id_factura = result.rows[0].id;

    
    const queryg1 = {
      text: 'INSERT INTO penalizaciong1 (id_facturas, numero_penalizaciones, coste_unitario, ponderacion1) VALUES ($1 , $2, $3, $4)',
      values: [id_factura, factura_final.factura1, unitariog1,ponderaciones.penalizacion1],
    };
    pool.query(queryg1, (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Penalizacion1 guardada correctamente');
      }
    });
    
    const queryg2 = {
      text: 'INSERT INTO penalizaciong2 (id_facturas, numero_penalizaciones, coste_unitario, ponderacion2) VALUES ($1 , $2, $3, $4)',
      values: [id_factura, factura_final.factura2, unitariog2,ponderaciones.penalizacion2],
    };
    pool.query(queryg2, (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Penalizacion2 guardada correctamente');
      }
    });

    const queryg3 = {
      text: 'INSERT INTO penalizaciong3 (id_facturas, numero_penalizaciones, coste_unitario, ponderacion3) VALUES ($1 , $2, $3, $4)',
      values: [id_factura, factura_final.factura3, unitariog3,ponderaciones.penalizacion3],
    };
    pool.query(queryg3, (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Penalizacion3 guardada correctamente');
      }
    });

    const queryg4 = {
      text: 'INSERT INTO penalizaciong4 (id_facturas, numero_penalizaciones, coste_unitario, ponderacion4) VALUES ($1 , $2, $3, $4)',
      values: [id_factura, factura_final.factura4, unitariog4,ponderaciones.penalizacion4],
    };
    pool.query(queryg4, (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Penalizacion4 guardada correctamente');
      }
    });

    const queryg5 = {
      text: 'INSERT INTO penalizaciong5 (id_facturas, numero_penalizaciones, coste_unitario, ponderacion5) VALUES ($1 , $2, $3, $4)',
      values: [id_factura, factura_final.factura5, unitariog5,ponderaciones.penalizacion5],
    };
    pool.query(queryg5, (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Penalizacion5 guardada correctamente');
      }
    });
    const queryg6 = {
      text: 'INSERT INTO penalizaciong6 (id_facturas, numero_penalizaciones, coste_unitario, ponderacion6) VALUES ($1 , $2, $3, $4)',
      values: [id_factura, factura_final.factura6, unitariog6,ponderaciones.penalizacion6],
    };
    pool.query(queryg6, (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Penalizacion6 guardada correctamente');
      }
    });
    guardarDatos(factura_final,valores,ponderaciones,id_factura);
  }
  
});

res.render('factura',{factura : factura_final, valores : valores, ponderaciones : ponderaciones, c_unitarios : unitarios});

valorg1eq[equipo]=[0];
    valorg2eq[equipo]=[0];
    valorg3eq[equipo]=[0];
    valorg4eq[equipo]=[0];
    valorg5eq[equipo]=[0];
    valorg6eq[equipo]=[0];
    tiempoeq[equipo]=[];
    ifInOctets[equipo]=[];
    ifOutOctets[equipo]=[];
});
});

function guardarDatos(numero_penalizaciones,valores,ponderaciones,id_factura)
{
  
const csv ='\n'+id_factura+','+valores.equipo+','+ ponderaciones.total+','+valores.cliente+','+valores.fecha;
const filePath = './src/public/facturas/facturas.csv';

const cabecera_factura = 'id, id_pcs, coste_t, nombre, fecha_y_hora'
const cabecera_tabla1 = 'id_facturas, numero_penalizaciones, coste_unitario, ponderacion1'
const cabecera_tabla2= 'id_facturas, numero_penalizaciones, coste_unitario, ponderacion2'
const cabecera_tabla3 = 'id_facturas, numero_penalizaciones, coste_unitario, ponderacion3'
const cabecera_tabla4 = 'id_facturas, numero_penalizaciones, coste_unitario, ponderacion4'
const cabecera_tabla5 = 'id_facturas, numero_penalizaciones, coste_unitario, ponderacion5'
const cabecera_tabla6 = 'id_facturas, numero_penalizaciones, coste_unitario, ponderacion6'


const csvpenalizacion1 ='\n'+id_factura+','+numero_penalizaciones.factura1+','+ unitariog1+','+ponderaciones.penalizacion1;
const filePathpenalizacion1 = './src/public/facturas/penalizacion1.csv';

const csvpenalizacion2 ='\n'+id_factura+','+numero_penalizaciones.factura2+','+ unitariog2+','+ponderaciones.penalizacion2;
const filePathpenalizacion2 = './src/public/facturas/penalizacion2.csv';

const csvpenalizacion3 ='\n'+id_factura+','+numero_penalizaciones.factura3+','+ unitariog3+','+ponderaciones.penalizacion3;
const filePathpenalizacion3 = './src/public/facturas/penalizacion3.csv';

const csvpenalizacion4 ='\n'+id_factura+','+numero_penalizaciones.factura4+','+ unitariog4+','+ponderaciones.penalizacion4;
const filePathpenalizacion4 = './src/public/facturas/penalizacion4.csv';

const csvpenalizacion5 ='\n'+id_factura+','+numero_penalizaciones.factura5+','+ unitariog5+','+ponderaciones.penalizacion5;
const filePathpenalizacion5 = './src/public/facturas/penalizacion5.csv';

const csvpenalizacion6 ='\n'+id_factura+','+numero_penalizaciones.factura6+','+ unitariog6+','+ponderaciones.penalizacion6;
const filePathpenalizacion6 = './src/public/facturas/penalizacion6.csv';

fs.access(filePath, fs.constants.F_OK, (err) => {
  if (err) {
    // El archivo no existe, lo creamos y escribimos los datos
    fs.writeFile(filePath, cabecera_factura, (err) => {
      if (err) throw err;
      console.log('Creado el archivo facturas.csv');
      // El archivo existe, escribimos los datos al final
    fs.appendFile(filePath, csv, (err) => {
      if (err) throw err;
     
    });
    });
  } 
  else{
    // El archivo existe, escribimos los datos al final
    fs.appendFile(filePath, csv, (err) => {
      if (err) throw err;
      
    });
  }
  
});

fs.access(filePathpenalizacion1, fs.constants.F_OK, (err) => {
  if (err) {
    // El archivo no existe, lo creamos y escribimos los datos
    fs.writeFile(filePathpenalizacion1, cabecera_tabla1, (err) => {
      if (err) throw err;
      console.log('Creado el archivo penalizacion1.csv');
       // El archivo existe, escribimos los datos al final
    fs.appendFile(filePathpenalizacion1, csvpenalizacion1, (err) => {
      if (err) throw err;
      
    });
    });
  } 
  else{  
  // El archivo existe, escribimos los datos al final
    fs.appendFile(filePathpenalizacion1, csvpenalizacion1, (err) => {
      if (err) throw err;
      
    });
  }
});

fs.access(filePathpenalizacion2, fs.constants.F_OK, (err) => {
  if (err) {
    // El archivo no existe, lo creamos y escribimos los datos
    fs.writeFile(filePathpenalizacion2, cabecera_tabla2, (err) => {
      if (err) throw err;
      console.log('Creado el archivo penalizacion2.csv');
      fs.appendFile(filePathpenalizacion2, csvpenalizacion2, (err) => {
        if (err) throw err;
       
      });
    });
  } 

  else{
    // El archivo existe, escribimos los datos al final
    fs.appendFile(filePathpenalizacion2, csvpenalizacion2, (err) => {
      if (err) throw err;
     
    });
  }
  
});

fs.access(filePathpenalizacion3, fs.constants.F_OK, (err) => {
  if (err) {
    // El archivo no existe, lo creamos y escribimos los datos
    fs.writeFile(filePathpenalizacion3, cabecera_tabla3, (err) => {
      if (err) throw err;
      console.log('Creado el archivo penalizacion3.csv');
      // El archivo existe, escribimos los datos al final
    fs.appendFile(filePathpenalizacion3, csvpenalizacion3, (err) => {
      if (err) throw err;
      
    });
    });
  } 
  else{
    fs.appendFile(filePathpenalizacion3, csvpenalizacion3, (err) => {
      if (err) throw err;
      
    });
    
  }
});

fs.access(filePathpenalizacion4, fs.constants.F_OK, (err) => {
  if (err) {
    // El archivo no existe, lo creamos y escribimos los datos
    fs.writeFile(filePathpenalizacion4, cabecera_tabla4, (err) => {
      if (err) throw err;
      console.log('Creado el archivo penalizacion4.csv');
      // El archivo existe, escribimos los datos al final
      fs.appendFile(filePathpenalizacion4, csvpenalizacion4, (err) => {
      if (err) throw err;
     
    });
    });

  } 
  else{
    // El archivo existe, escribimos los datos al final
    fs.appendFile(filePathpenalizacion4, csvpenalizacion4, (err) => {
      if (err) throw err;
      
    });
  }
});

fs.access(filePathpenalizacion5, fs.constants.F_OK, (err) => {
  if (err) {
    // El archivo no existe, lo creamos y escribimos los datos
    fs.writeFile(filePathpenalizacion5, cabecera_tabla5, (err) => {
      if (err) throw err;
      console.log('Creado el archivo penalizacion5.csv');
       // El archivo existe, escribimos los datos al final
      fs.appendFile(filePathpenalizacion5, csvpenalizacion5, (err) => {
      if (err) throw err;
     
    });
    });
  } 
  else{
     // El archivo existe, escribimos los datos al final
     fs.appendFile(filePathpenalizacion5, csvpenalizacion5, (err) => {
      if (err) throw err;
      
    });
  }
   
  
});

fs.access(filePathpenalizacion6, fs.constants.F_OK, (err) => {
  if (err) {
    // El archivo no existe, lo creamos y escribimos los datos
    fs.writeFile(filePathpenalizacion6, cabecera_tabla6, (err) => {
      if (err) throw err;
      console.log('Creado el archivo penalizacion6.csv');
      // El archivo existe, escribimos los datos al final
    fs.appendFile(filePathpenalizacion6, csvpenalizacion6, (err) => {
      if (err) throw err;    
    });
    });
  } 
    // El archivo existe, escribimos los datos al final
    fs.appendFile(filePathpenalizacion6, csvpenalizacion6, (err) => {
      if (err) throw err;
    
    });
  
});


}


