DROP TABLE IF EXISTS usuarios CASCADE;
CREATE TABLE IF NOT EXISTS usuarios(
  nombre VARCHAR( 20 ) NOT NULL PRIMARY KEY,
  clave VARCHAR( 100 ) NOT NULL
);

--
-- Estructura de tabla para la tabla `pctodos`
--
DROP TABLE IF EXISTS pcs;
CREATE TABLE IF NOT EXISTS pcs (
  id SERIAL,
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
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  factura BYTEA NOT NULL
);

--
-- Insercion de datos de ejemplo
--
INSERT INTO usuarios VALUES('usuario','clave');

