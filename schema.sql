-- schema.sql  — El Catre S.R.L (Mueblería)

-- 1) Base y usuario (podés cambiar claves si querés)
CREATE DATABASE IF NOT EXISTS elcatre
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elcatre;

-- 2) Tablas maestras
CREATE TABLE usuarios (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  email        VARCHAR(120) NOT NULL UNIQUE,
  pass_hash    VARCHAR(255) NOT NULL,
  rol          ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  fecha_alta   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  slug   VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE productos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id  INT NOT NULL,
  nombre        VARCHAR(140) NOT NULL,
  descripcion   TEXT,
  precio        DECIMAL(10,2) NOT NULL,
  stock         INT NOT NULL DEFAULT 10,
  imagen        VARCHAR(200) NOT NULL,
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  fecha_alta    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prod_cat FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_prod_cat (categoria_id),
  INDEX idx_prod_nombre (nombre)
);

-- 3) Carrito (sesión) y pedidos
CREATE TABLE carritos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NULL,
  estado      ENUM('abierto','cerrado') NOT NULL DEFAULT 'abierto',
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_carr_user FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE carrito_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  carrito_id    INT NOT NULL,
  producto_id   INT NOT NULL,
  cantidad      INT NOT NULL DEFAULT 1,
  precio_unit   DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_ci_carr FOREIGN KEY (carrito_id) REFERENCES carritos(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ci_prod FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uq_item (carrito_id, producto_id)
);

CREATE TABLE pedidos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  carrito_id    INT NOT NULL UNIQUE,
  usuario_id    INT NULL,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(120) NOT NULL,
  telefono      VARCHAR(40),
  direccion     VARCHAR(200),
  total         DECIMAL(10,2) NOT NULL,
  estado        ENUM('recibido','pago_confirmado','preparacion','despachado','entregado') NOT NULL DEFAULT 'recibido',
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ped_carr FOREIGN KEY (carrito_id) REFERENCES carritos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ped_user FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE pedido_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id     INT NOT NULL,
  producto_id   INT NOT NULL,
  cantidad      INT NOT NULL,
  precio_unit   DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_pi_ped FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pi_prod FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- (Opcional) Reseñas de la tienda
CREATE TABLE reseñas_tienda (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  estrellas  TINYINT NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario VARCHAR(400) NOT NULL,
  creado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- 4) Semillas (categorías + productos mapeando a tus imágenes)
INSERT INTO categorias (nombre, slug) VALUES
 ('Sillas','sillas'),('Mesas','mesas'),('Estanterías','estanterias'),
 ('Sofás','sofas'),('Camas','camas'),('Escritorios','escritorios'),
 ('Placares','placares'),('Roperos','roperos');

-- NOTA: ajustá nombre/categoría si querés que coincida exactamente con tus fotos.
-- Usamos tus nombres de archivo: "img/Image 01.jpg" ... "img/Image 12.jpg"
INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen) VALUES
 (1,'Silla Eames','Silla plástica con patas de madera', 3490, 15, 'img/Image 01.jpg'),
 (1,'Silla Tapizada','Silla comedor tapizada',         5290, 10, 'img/Image 02.jpg'),
 (2,'Mesa Comedor 6p','MDF y patas de metal',          11990, 6, 'img/Image 03.jpg'),
 (2,'Mesa Ratona','Madera maciza',                      6990, 8, 'img/Image 04.jpg'),
 (3,'Estantería 5N','Melamina blanca',                  5490, 9, 'img/Image 05.jpg'),
 (4,'Sofá 2 cuerpos','Tela antimanchas',               25990, 4, 'img/Image 06.jpg'),
 (4,'Sofá 3 cuerpos','Diseño clásico',                 31990, 3, 'img/Image 07.jpg'),
 (5,'Cama 2 plazas','Estructura de pino',              18990, 7, 'img/Image 08.jpg'),
 (6,'Escritorio Gamer','Con pasacables',                9990, 5, 'img/Image 09.jpg'),
 (7,'Placard 3 puertas','Con espejo',                  21990, 5, 'img/Image 10.jpg'),
 (8,'Ropero Infantil','2 puertas + cajones',           15990, 6, 'img/Image 11.jpg'),
 (3,'Estantería Metálica','Cargas livianas',            4890,12, 'img/Image 12.jpg');

-- Admin demo (clave: admin123 — bcrypt generada como ejemplo)
INSERT INTO usuarios (nombre,email,pass_hash,rol)
VALUES ('Administrador','admin@elcatre.com',
'$2y$10$0Jm5Oai3s0xXj4l6cW5u7OUcJQxk3aI9oYhQqNnJ/3p5y0o1cWxQK','admin');
