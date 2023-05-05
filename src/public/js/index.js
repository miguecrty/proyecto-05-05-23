window.onload = function() {
    // Obtener todos los botones con id que empiezan con "boton-"
        const botonesIniciar = document.querySelectorAll("[id^='botonI-']");
        const botonesDetener = document.querySelectorAll("[id^='botonD-']");
let factura=[];
// Agregar un evento de clic a cada botón
if(botonesIniciar != null){
botonesIniciar.forEach(boton => {
  
  boton.addEventListener("click", () => {
    
    let id = boton.id.substring(7);
    const mensaje =  document.getElementById("mensaje-"+id);
    if(factura[id] != true){
    const botonseleccionado = document.getElementById("botonI-"+id);
    const botonseleccionadodetener = document.getElementById("botonD-"+id);
    let userInput = prompt("Introduce el nombre de la persona que va a utilizar el PC: \n");
    if (userInput === null) {
    } else {
    iniciarSNMP(id,userInput);  
    botonseleccionado.style.display="none";
    botonseleccionadodetener.style.display="block";
    }
  }
  else{
    mensaje.style.display = "block";
mensaje.animate([
  { opacity: 0, transform: "translateY(100%)" },
  { opacity: 1, transform: "translateY(0)" }
], {
  duration: 500,
  easing: "ease-in-out",
  iterations: 100000
});
  }
  });

});
}
if(botonesDetener != null){
botonesDetener.forEach(boton => {
    boton.addEventListener("click", () => {
      let id = boton.id.substring(7);
      const botonseleccionadodetener = document.getElementById("botonD-"+id);
      const botonseleccionadoiniciar = document.getElementById("botonI-"+id);
      
      const div = document.getElementById("op");
      let userInput = confirm("¿Seguro que deseas detener el equipo "+id+"? \n");
    if (userInput == false) {
    } else {
      detenerSNMP(id);
      factura[id] = true;
      
      const botonfactura = document.getElementById("factura-"+id);
      botonseleccionadodetener.style.display="none";
      botonseleccionadoiniciar.style.display="block";
      botonfactura.style.display="block";
      botonfactura.addEventListener("click", () => {
        let url = '/factura?id='+id;
        window.open(url, "_blank");
        const mensaje =  document.getElementById("mensaje-"+id);
        mensaje.style.display = "none";
        botonfactura.style.display="none";
        factura[id] = false;
      });
      
    }
    
  });
  });
}

function iniciarSNMP(id,nombre){ 
    fetch('/iniciarsnmp?equipo='+id+'&nombre='+nombre)
  .then(response => {
    return response.json();
  })
  .then(data => {
  })

  
  }
  }
  
function detenerSNMP(id){
    fetch('/detenersnmp?equipo='+id)
.then(response => {
return response.json();
})
.then(data => {
})
}

