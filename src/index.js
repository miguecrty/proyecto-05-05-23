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


//let ip_juanma="192.168.100.38";
let ip_migue="192.168.1.145";
let ip_rafa="192.168.1.172";

let ips = [ip_migue,ip_rafa];
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

      if(results.rows[i].numcpu == '0')
      { 
        pool.query("SELECT ip FROM pcs WHERE numcpu='"+0+"'", (error, results) => {
          for(let i=0;i<results.rows.length;i++){
            let ip = (results.rows[i]).ip;
            let oid_nucleos = [1,3,6,1,2,1,25,3,3,1]; // OID para hrProcessorEntry
             insertarNucleos(ips[i],oid_nucleos);
          }
        });
      }
      if(cpu_nucleos == "")
      { 
        let oid_pos_inicio = ["1.3.6.1.2.1.25.3.3.1.1"];
        insertarPosicionInicioNucleos(ips[i],oid_pos_inicio,i);

      }
    }
    for(let i = 0; i< results.rows.length;i++)
    {
      if(results.rows[i].syscontact == "-" || results.rows[i].ifindex == "-" || results.rows[i].numcpu == "-" || results.rows[i].sys_name == "-" || results.rows[i].syslocation == "-")
      {
      console.log(results.rows[i])
      }
      else
      {
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
  console.log(ip)
  var session = snmp.createSession(ip, "public", {timeout : 5000});
  session.get(oid_ifIndex, function(error, varbinds) {
    if (error) {
      console.log("Error en la ip: "+ip);
    } else 
    {
      const ifindex = varbinds[0].value.toString();
      console.log("Insertando a la BBDD ifIndex:"+ifindex+" a la ip="+ip);
      pool.query("UPDATE pcs SET ifindex ="+ifindex+" WHERE ip ='"+ip+"'", (error, results) => {
        if (error)
        {
          console.log("Error ifindex")
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
      console.error(error);
    } else {
      let num_cpu = varbinds.length/2;
      console.log(`Número de filas en la tabla: `+num_cpu);
      pool.query("UPDATE pcs SET numcpu ="+num_cpu+" WHERE ip ='"+ip+"'", (error, results) => {
        if (error)
        {
          console.log("Error Nucleos")
          insertarNucleos(ip,oid);
        }
      });
    }
  });
}
  function insertarPosicionInicioNucleos(ip,oid,posicion){
  var session = snmp.createSession(ip, "public", {timeout : 5000});
  session.getNext(oid, function(error, varbinds) {
    if (error) {
      console.log("Error en num_cpu: "+ip);
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
  secret: 'secreto', // Cambiar a una cadena aleatoria y segura en producción
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Solo enviar la cookie a través de HTTPS en producción
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


let estado_pcs = [];
let equipos;
let alquiladores = [];
let tiempoeq = [];
const TOTAL_EQUIPOS=5;

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
                              facturag4[id].penalizacion.push(1);
                              facturag4[id].tiempo.push(tiempoeq[id][tiempoeq[id].length-1]);
                            }
                        }
                    }
                    g4.push(cargaCPU);
                     }
        });
       
    

  
   let max = 10000;
   let min = 0;
   let v1 = Math.round(Math.random() * (40 - min) + 20);
   let v2 = 100-v1;
   
   let cpu1 =Math.round(Math.random() * (40 - min) + 20);
   let cpu2 =Math.round(Math.random() * (40 - min) + 20);
   let cpu3 =Math.round(Math.random() * (40 - min) + 20);
   let cpu4 =Math.round(Math.random() * (40 - min) + 20);
   let cpu5 =Math.round(Math.random() * (40 - min) + 20);
   let cpu6 =Math.round(Math.random() * (40 - min) + 20);
   let cpu7 =Math.round(Math.random() * (40 - min) + 20);
   let cpu8 =Math.round(Math.random() * (40 - min) + 20);

    const valorSNMPg5 = [v1,v2];
    const valorSNMPg4 = [cpu1,cpu2,cpu3,cpu4,cpu5,cpu6,cpu7,cpu8];
    const valorSNMPg6 = Math.round(Math.random() * (max - min) + min);
    if(g1 != null && g2 != null && g3 != null && g4 != null && g5 != null && g6 != null){
    g5.push(valorSNMPg5);
    g6.push(valorSNMPg6);
    }

    
    if(valorSNMPg5 > 5000)
    {
      facturag5[id].penalizacion.push(1);
      facturag5[id].tiempo.push(tiempoeq[id][tiempoeq[id].length-1]);
    }
    if(valorSNMPg6 > 5000)
    {
      facturag6[id].penalizacion.push(1);
      facturag6[id].tiempo.push(tiempoeq[id][tiempoeq[id].length-1]);
    }
    
    

 
//Para la CPU
    /*
    var session = snmp.createSession("192.168.1.145", "public");
     // OID para ifOutOctets del primer interfaz
        session.get(oids, function(error, varbinds) {
            if (error) {
                console.error(error);
            } else {
                let varbind=0;
                for (var i = 0; i < varbinds.length; i++) {
                    if (snmp.isVarbindError(varbinds[i])) {
                        console.error(snmp.varbindError(varbinds[i]));
                    } else {
                        console.log(varbinds[i].oid + " = " + varbinds[i].value);
                        varbind = varbind + varbinds[i].value;
                    }
                }
                varbind=varbind/8;
                console.log("Promedio de la CPU:" + varbind);
            }
        });
*/
       
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

    valorg1eq[equipo]=[0];
    valorg2eq[equipo]=[0];
    valorg3eq[equipo]=[0];
    valorg4eq[equipo]=[0];
    valorg5eq[equipo]=[0];
    valorg6eq[equipo]=[0];
    tiempoeq[equipo]=null;
    ifInOctets[equipo]=null;
    ifOutOctets[equipo]=null;
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
  console.log(equipo);
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
const fecha = new Date();
const dia = fecha.getDate().toString().padStart(2, '0');
const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
const anio = fecha.getFullYear().toString();
const fechaFormateada = `${dia}/${mes}/${anio}`;


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
let ponderacion_penalizacion1=facturag1[equipo].penalizacion.length*0.01;
let ponderacion_penalizacion2=facturag2[equipo].penalizacion.length*0.02;
let ponderacion_penalizacion3=facturag3[equipo].penalizacion.length*0.1;
let ponderacion_penalizacion4=facturag4[equipo].penalizacion.length*0.25;
let total=coste_tu + ponderacion_fija + ponderacion_penalizacion1 + ponderacion_penalizacion2 + ponderacion_penalizacion3 + ponderacion_penalizacion4;
let ponderaciones = {
  "penalizacion1":+ponderacion_penalizacion1,
  "penalizacion2":+ponderacion_penalizacion2,
  "penalizacion3":+ponderacion_penalizacion3,
  "penalizacion4":+ponderacion_penalizacion4,
  "total":+total.toFixed(2)
}
 
res.render('factura',{factura : factura_final, valores : valores, ponderaciones : ponderaciones});
});
});

app.post('/guardar-archivo',(req, res) => {
  const cliente = req.query.cliente;
  const query = {
    text: 'INSERT INTO facturas (nombre, factura) VALUES ($1, $2)',
    values: [cliente, req.body],
  };
  pool.query(query, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error al guardar el archivo');
    } else {
      console.log('Archivo guardado correctamente en PostgreSQL');
      res.send('Archivo guardado correctamente');
    }
  });
  

});







