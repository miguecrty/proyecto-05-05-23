
DROP TABLE IF EXISTS usuarios CASCADE;
CREATE TABLE IF NOT EXISTS usuarios(
  nombre VARCHAR( 20 ) NOT NULL PRIMARY KEY,
  clave VARCHAR( 100 ) NOT NULL
);


--
-- Estructura de tabla para la tabla `pctodos`


--
DROP TABLE IF EXISTS pcs CASCADE;
CREATE TABLE IF NOT EXISTS pcs (
  id SERIAL PRIMARY KEY,
  syscontact VARCHAR(20) NOT NULL,
  syslocation VARCHAR(20),
  ip VARCHAR(100) NOT NULL,
  sys_name VARCHAR(100) NOT NULL,
  img VARCHAR(100) NOT NULL,
  ifindex VARCHAR(100),
  numcpu INTEGER,
  estado boolean
);

DROP TABLE IF EXISTS facturas CASCADE;
CREATE TABLE facturas (
  id SERIAL PRIMARY KEY, --id factura 
  id_pcs INTEGER, --id del pc
  FOREIGN KEY (id_pcs) REFERENCES pcs(id),
  coste_t FLOAT, --coste total 
  nombre VARCHAR(255) NOT NULL,
  fecha_y_hora VARCHAR(255)
);

DROP TABLE IF EXISTS penalizaciong1 CASCADE;
CREATE TABLE penalizaciong1 (
  id_facturas INTEGER PRIMARY KEY,
  FOREIGN KEY (id_facturas) REFERENCES facturas(id),
  numero_penalizaciones INTEGER,
  coste_unitario FLOAT,
  ponderacion1 FLOAT
);


DROP TABLE IF EXISTS penalizaciong2 CASCADE;
CREATE TABLE penalizaciong2 (
  id_facturas INTEGER PRIMARY KEY,
  FOREIGN KEY (id_facturas) REFERENCES facturas(id),
  numero_penalizaciones INTEGER,
  coste_unitario FLOAT,
  ponderacion2 FLOAT
);

DROP TABLE IF EXISTS penalizaciong3 CASCADE;
CREATE TABLE penalizaciong3 (
  id_facturas INTEGER PRIMARY KEY,
  FOREIGN KEY (id_facturas) REFERENCES facturas(id),
  numero_penalizaciones INTEGER,
  coste_unitario FLOAT,
  ponderacion3 FLOAT
);

DROP TABLE IF EXISTS penalizaciong4 CASCADE;
CREATE TABLE penalizaciong4 (
  id_facturas INTEGER PRIMARY KEY,
  FOREIGN KEY (id_facturas) REFERENCES facturas(id),
  numero_penalizaciones INTEGER,
  coste_unitario FLOAT,
  ponderacion4 FLOAT
);

DROP TABLE IF EXISTS penalizaciong5 CASCADE;
CREATE TABLE penalizaciong5 (
  id_facturas INTEGER PRIMARY KEY,
  FOREIGN KEY (id_facturas) REFERENCES facturas(id),
  numero_penalizaciones INTEGER,
  coste_unitario FLOAT,
  ponderacion5 FLOAT
);


DROP TABLE IF EXISTS penalizaciong6 CASCADE;
CREATE TABLE penalizaciong6 (
  id_facturas INTEGER PRIMARY KEY,
  FOREIGN KEY (id_facturas) REFERENCES facturas(id),
  numero_penalizaciones INTEGER,
  coste_unitario FLOAT,
  ponderacion6 FLOAT
);




--
-- Insercion de datos de ejemplo
--

INSERT INTO usuarios VALUES('usuario','clave');
