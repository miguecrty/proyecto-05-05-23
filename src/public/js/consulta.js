window.onload = function() {
  let id;
  let ultid=0;
  let num_equipos=0;
  let eleccion;
  let chart1;
  let chart2;
  let chart3;
  let chart4;
  let chart5;
  let chart6;
  let prueba = [1,2,3,4,5];
  let activo = [];
  let actualiza1;
  let actualiza2;
  let actualiza3;
  let actualiza4;
  let actualiza5;
  let actualiza6;
  let muestratiempo;
  let tiempo = [];

  async function actualizarGraficas(id,grafica) {
    const respuesta = await fetch('/actualizargraficas?id='+id+'&grafica='+grafica);
    const datos = await respuesta.json();
    return datos;
  }
  async function muestra_tiempo(id) {
    const respuesta = await fetch('/muestratiempo?id='+id);
    const datos = await respuesta.json();
    return datos;
  }
 
    const selectCustom = document.querySelector('.select-custom');
    const div1 = document.getElementById("grafica1");
    const div2 = document.getElementById("grafica2");
    const div3 = document.getElementById("grafica3");
    const div4 = document.getElementById("grafica4");
    const div5 = document.getElementById("grafica5");
    const div6 = document.getElementById("grafica6");
    const selectOptions = selectCustom.querySelector('.select-options');
    selectOptions.innerHTML='';
    // Realizar petición al servidor para obtener nuevos datos
    fetch('/actualizar')
      .then(response => response.json())
      .then(data => {
        data.forEach(opcion => {
          
          const selectOption = document.createElement('div');
          selectOption.className = 'select-option';

          const img = document.createElement('img');
          img.src = opcion.img;
          selectOption.appendChild(img);

          const span = document.createElement('span');
          span.className = 'option-text';
          span.id = opcion.id;
          span.name = opcion.syscontact;
          selectOption.appendChild(span);
          
          const table = document.createElement('table');
          table.className = 'table-option';

          const trHead = document.createElement('tr');
          const th1 = document.createElement('th');
          th1.textContent = 'Nombre';
          const th2 = document.createElement('th');
          th2.textContent = 'Sistema Operativo';
          const th3 = document.createElement('th');
          th3.textContent = 'Direccion IP';
          trHead.appendChild(th1);
          trHead.appendChild(th2);
          trHead.appendChild(th3);
          table.appendChild(trHead);

          const trBody = document.createElement('tr');
          const td1 = document.createElement('td');
          td1.textContent = opcion.syscontact;
          const td2 = document.createElement('td');
          td2.textContent = opcion.sys_name;
          const td3 = document.createElement('td');
          td3.textContent = opcion.ip;
          trBody.appendChild(td1);
          trBody.appendChild(td2);
          trBody.appendChild(td3);
          table.appendChild(trBody);
          selectOption.appendChild(table);
          selectOptions.appendChild(selectOption);
          divseleccion = document.getElementById("seleccion");
          selectOption.addEventListener('click', () => {
          eleccion = selectOption.querySelector('.option-text').id;
          let nombre =selectOption.querySelector('.option-text').name;
          divseleccion.textContent="Has seleccionado a "+nombre;

          clearInterval(muestratiempo);
          clearInterval(actualiza1);
          clearInterval(actualiza2);
          clearInterval(actualiza3);
          clearInterval(actualiza4);
          clearInterval(actualiza5);
          clearInterval(actualiza6);
          if (id != eleccion)
          { 
            if(chart1 != null)
            {
            chart1.destroy();
            chart2.destroy();
            chart3.destroy();
            chart4.destroy();
            chart5.destroy();
            chart6.destroy();
            }
            mostrar(eleccion);
          }
        });
        });
      });
 


  function mostrar(eleccion){
    mostrarGrafica1(eleccion);
    mostrarGrafica2(eleccion);
    mostrarGrafica3(eleccion);
    mostrarGrafica4(eleccion);
    mostrarGrafica5(eleccion);
    mostrarGrafica6(eleccion);
    muestraTiempo(eleccion);
  }
  function muestraTiempo(id){
    let divtiempo = document.getElementById("tiempo");
    muestra_tiempo(id).then(function(valor) 
    {
      tiempo[id]=valor.tiempo
      let horas = Math.floor(valor.tiempo / 3600);
      let minutos = Math.floor((valor.tiempo % 3600) / 60);
      let segundosRestantes = valor.tiempo % 60;

  // Agregar un cero delante del número si es menor que 10
  if (horas < 10) {
    horas = "0" + horas;
  }
  if (minutos < 10) {
    minutos = "0" + minutos;
  }
  if (segundosRestantes < 10) {
    segundosRestantes = "0" + segundosRestantes;
  }
     divtiempo.textContent = "Tiempo realizando SNMP: " +horas + ":" + minutos + ":" + segundosRestantes;
    });
    muestratiempo =  setInterval(function() {
      tiempo[id]=tiempo[id]+1;
      let horas = Math.floor(tiempo[id] / 3600);
      let minutos = Math.floor((tiempo[id] % 3600) / 60);
      let segundosRestantes = tiempo[id] % 60;

  // Agregar un cero delante del número si es menor que 10
  if (horas < 10) {
    horas = "0" + horas;
  }
  if (minutos < 10) {
    minutos = "0" + minutos;
  }
  if (segundosRestantes < 10) {
    segundosRestantes = "0" + segundosRestantes;
  }
     divtiempo.textContent = "Tiempo realizando SNMP: " +horas + ":" + minutos + ":" + segundosRestantes;
    },1000);
 
  }

  function mostrarGrafica1(id){

    let ctx = document.getElementById('myChart').getContext('2d');
    div1.style.display="block";
    actualizarGraficas(id, 1).then(function(nuevosValores) 
    {
      chart1 = new Chart(ctx, {
        type: 'line',
        data: {
          labels: nuevosValores.tiempo,
          datasets: [{
            label: 'Valor del tiempo',
            data: nuevosValores.valorg1,
            backgroundColor: 'transparent',
            borderColor: 'blue',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            xAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Valor'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Tiempo'
              },
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });
    actualiza1 =  setInterval(function() {
      ultid = id;
      actualizarGraficas(id, 1).then(function(nuevosValores) {
        // Actualiza los datos de la gráfica con los nuevos valores recibidos
        var chartData = chart1.data.datasets[0].data;
        var chartLabels = chart1.data.labels;
        // Agregar los nuevos datos en la última posición
        chartData.push(nuevosValores.valorg1[nuevosValores.valorg1.length-1]);
        chartLabels.push(nuevosValores.tiempo[nuevosValores.tiempo.length-1]);
        // Actualizar la gráfica con los nuevos datos
        chart1.update();
      });
      
    },5000);
    }).catch(function(error) {
      console.error(error);
    });
    
  }
  function mostrarGrafica2(id){

    let ctx = document.getElementById('myChart2').getContext('2d');
    div2.style.display="block";
    actualizarGraficas(id, 2).then(function(nuevosValores) 
    {
      chart2 = new Chart(ctx, {
        type: 'line',
        data: {
          labels: nuevosValores.tiempo,
          datasets: [{
            label: 'Valor del tiempo',
            data: nuevosValores.valorg2,
            backgroundColor: 'transparent',
            borderColor: 'blue',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            xAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Valor'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Tiempo'
              },
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });
    actualiza2 =  setInterval(function() {
      ultid = id;
      actualizarGraficas(id, 2).then(function(nuevosValores) {
        // Actualiza los datos de la gráfica con los nuevos valores recibidos
        var chartData = chart2.data.datasets[0].data;
        var chartLabels = chart2.data.labels;
        // Agregar los nuevos datos en la última posición
        chartData.push(nuevosValores.valorg2[nuevosValores.valorg2.length-1]);
        chartLabels.push(nuevosValores.tiempo[nuevosValores.tiempo.length-1]);
        // Actualizar la gráfica con los nuevos datos
        chart2.update();
      });
      
    },5000);
    }).catch(function(error) {
      console.error(error);
    });
    
  }
  function mostrarGrafica3(id){
    
    let ctx = document.getElementById('myChart3').getContext('2d');
    div3.style.display="block";
    actualizarGraficas(id, 3).then(function(nuevosValores) 
    {
      console.log(nuevosValores.valorg3);
      chart3 = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ["RAM USADA","RAM SIN UTILIZAR"],
          datasets: [{
            label: 'Valor del tiempo',
            data: nuevosValores.valorg3[nuevosValores.valorg3.length - 1],
            backgroundColor: [
              'green',
              'rgb(54, 50, 235)'
            ]
          }]
        },
        options: {
          plugins: {
            legend: {
              display: false
            },
            datalabels: {
              display: true,
              formatter: function(value, context) {
                var label = context.chart.data.labels[context.dataIndex] + ': ';
                label += value.toFixed(2) + '%'; // agregar el símbolo de porcentaje
                return label;
              }
            }
          }
        }
      });
    actualiza3 =  setInterval(function() {
      ultid = id;
       
      actualizarGraficas(id, 3).then(function(nuevosValores) {
        // Actualiza los datos de la gráfica con los nuevos valores recibidos
        var chartData = nuevosValores.valorg3[nuevosValores.valorg3.length - 1];
        chart3.data.datasets[0].data = chartData;
        chart3.update();
      });
      
    },5000);
    }).catch(function(error) {
      console.error(error);
    });
    
    
  }
  function mostrarGrafica4(id){
    let label_cpu = ["CPU1","CPU2","CPU3","CPU4","CPU5","CPU6","CPU7","CPU8","CPU9","CPU10","CPU11","CPU12"];
    let colores = [
      'rgb(255, 99, 132)',
      'rgb(54, 50, 235)',
      'rgb(100, 162, 235)',
      'rgb(54, 162, 100)',
      'rgb(54, 162, 30)',
      'rgb(80, 70, 20)',
      'rgb(92, 92, 235)',
      'rgb(25, 25, 25)',
      'rgb(255, 99, 132)',
      'rgb(255, 99, 132)',
      'rgb(255, 99, 132)',
      'rgb(255, 99, 132)'
    ];
    let ctx = document.getElementById('myChart4').getContext('2d');
    div4.style.display="block";
    actualizarGraficas(id, 4).then(function(nuevosValores) 
    {
      let numcpu =  nuevosValores.valorg4[nuevosValores.valorg4.length - 1];
      let numero = label_cpu.slice(0, numcpu.length);
      let colors = colores.slice(0, numcpu.length);
      chart4 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: numero,
          datasets: [{
            label: 'Valor del tiempo',
            data: numcpu,
            backgroundColor: colors
          }]
        },
        options: {
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });
      actualiza4 = setInterval(function() {
        ultid = id;
        actualizarGraficas(id, 4).then(function(nuevosValores) {
          // Actualiza los datos de la gráfica con los nuevos valores recibidos
          var chartData = nuevosValores.valorg4[nuevosValores.valorg4.length - 1];
          chart4.data.labels = numero;
          chart4.data.datasets[0].data = chartData;
          chart4.data.datasets[0].backgroundColor = colors;
          
          chart4.update();
        });
      },5000);
    }).catch(function(error) {
      console.error(error);
    });
    
    
  }
  function mostrarGrafica5(id){
    
    let ctx = document.getElementById('myChart5').getContext('2d');
    div5.style.display="block";
    actualizarGraficas(id, 5).then(function(nuevosValores) 
    {
      chart5 = new Chart(ctx, {
        type: 'line',
        data: {
          labels: nuevosValores.tiempo,
          datasets: [{
            label: 'Valor del tiempo',
            data: nuevosValores.valorg5,
            backgroundColor: 'transparent',
            borderColor: 'blue',
            borderWidth: 1
          }]
        },
        options: {
        }
      });
    actualiza5 =  setInterval(function() {
      ultid = id;
    
      actualizarGraficas(id, 5).then(function(nuevosValores) {
        // Actualiza los datos de la gráfica con los nuevos valores recibidos
        var chartData = chart5.data.datasets[0].data;
        var chartLabels = chart5.data.labels;
        // Agregar los nuevos datos en la última posición
        chartData.push(nuevosValores.valorg5[nuevosValores.valorg5.length-1]);
        chartLabels.push(nuevosValores.tiempo[nuevosValores.tiempo.length-1]);
        // Actualizar la gráfica con los nuevos datos
        chart5.update();
      });
      
    },5000);
    }).catch(function(error) {
      console.error(error);
    });
    
  }
  function mostrarGrafica6(id){
  
    let ctx = document.getElementById('myChart6').getContext('2d');
    div6.style.display="block";
    actualizarGraficas(id, 6).then(function(nuevosValores) 
    {
      chart6 = new Chart(ctx, {
        type: 'line',
        data: {
          labels: nuevosValores.tiempo,
          datasets: [{
            label: 'Valor del tiempo',
            data: nuevosValores.valorg6,
            backgroundColor: 'transparent',
            borderColor: 'blue',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            xAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Valor'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Tiempo'
              },
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });
    actualiza6 =  setInterval(function() {
      ultid = id;
      actualizarGraficas(id, 6).then(function(nuevosValores) {
        // Actualiza los datos de la gráfica con los nuevos valores recibidos
        var chartData = chart6.data.datasets[0].data;
        var chartLabels = chart6.data.labels;
        // Agregar los nuevos datos en la última posición
        chartData.push(nuevosValores.valorg6[nuevosValores.valorg6.length-1]);
        chartLabels.push(nuevosValores.tiempo[nuevosValores.tiempo.length-1]);
        // Actualizar la gráfica con los nuevos datos
        chart6.update();
      });
      
    },5000);
    }).catch(function(error) {
      console.error(error);
    });
    
  }
  
  }

