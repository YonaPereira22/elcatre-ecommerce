# Informe – Entrega 1 (Mueblería)

## Portada
Carrera: Profesorado de Informática  
Materia: Taller Integrador I  
Integrantes: Emiliano Urruti, Yonatan Pereira, Lucía Rodriguez  
Docentes: Departamento de Informática 
Fecha: 17/09/2025

---

## Introducción
El presente documento corresponde a la **Primera Entrega** del Proyecto Integrador para la creación de un sistema web de pedidos en línea destinado a una mueblería.  
El objetivo de este trabajo es sentar las bases conceptuales y técnicas del proyecto, presentando un prototipo inicial navegable, junto con la documentación preliminar que describe el problema, los objetivos y los requerimientos relevados hasta el momento.  
Esta etapa se enfoca en la organización del equipo, el análisis de necesidades y el diseño de los modelos iniciales que permitirán guiar el desarrollo de las próximas fases.

---

## Objetivos del proyecto
**Objetivo general:**  
Diseñar y desarrollar un sistema web que permita a los clientes de la mueblería consultar el catálogo de productos, gestionar pedidos y facilitar el proceso de compra en línea, optimizando la interacción y la gestión de stock por parte de los administradores.

**Objetivos específicos:**  
- Elaborar un **prototipo navegable** que represente la estructura y las principales funcionalidades de la aplicación.  
- Relevar los **requerimientos funcionales y no funcionales**, a partir de entrevistas y análisis del contexto.  
- Diseñar el **Modelo Entidad-Relación (MER)** y un **Diagrama de Secuencia** inicial para describir los principales procesos del sistema.  
- Establecer un **plan de trabajo** y roles de equipo que aseguren la correcta ejecución de las siguientes fases del proyecto.  
- Definir lineamientos de **usabilidad y accesibilidad** que garanticen una experiencia clara y amigable para los usuarios.

---

## Requerimientos (síntesis de entrevistas)
A partir de entrevistas preliminares realizadas a potenciales usuarios y al encargado de la mueblería, se identificaron los siguientes requerimientos:

### Requerimientos funcionales
- Mostrar un **catálogo** con fotos, nombre, precio, stock y descripción de los productos.  
- Permitir **filtrar por categorías** y buscar productos por nombre.  
- Contar con un **carrito de compras** que calcule automáticamente el total.  
- Incluir un módulo de **gestión de pedidos** para el administrador (control de estado: pendiente, pagado, entregado).  
- Registrar los datos de los clientes (nombre, email, teléfono, dirección).  
- Simular medios de pago (efectivo, transferencia, tarjeta).

### Requerimientos no funcionales
- Interfaz **simple, clara y responsive**, accesible desde computadoras y dispositivos móviles.  
- **Seguridad básica** en el manejo de datos (credenciales, pedidos).  
- Posibilidad de crecer en funcionalidades futuras (historial de pedidos, reportes).  
- Facilidad para **actualizar stock y precios** sin modificar el código fuente.

> Estos requerimientos constituyen el punto de partida para el desarrollo; a medida que se avance con entrevistas y pruebas, se ajustarán y priorizarán según las necesidades del negocio.

---

## Diagramas

### Modelo Entidad–Relación (MER)
![MER](mer.png)

> El modelo contempla cuatro entidades principales:
> - **Usuarios**: almacena clientes y administradores, diferenciados por el campo `rol`.  
> - **Productos**: define los artículos disponibles (nombre, descripción, precio, stock, imagen).  
> - **Pedidos**: representa cada compra, asociada a un usuario, con fecha, total y estado.  
> - **DetallePedido**: resuelve la relación N:N entre pedidos y productos, guardando cantidad y subtotal.

Se eligió normalizar las tablas para evitar duplicación de datos y facilitar la escalabilidad del sistema.

---

### Diagrama de Secuencia – Agregar producto al carrito
![Secuencia](secuencia.png)

> El diagrama describe el flujo básico cuando un cliente añade un producto al carrito.  
> La interfaz captura la acción del usuario y llama a la función `agregarAlCarrito` en JavaScript, que guarda el producto en el almacenamiento local y recalcula el total.  
> Finalmente, se actualiza la vista del carrito, mostrando los productos y el monto acumulado.

---

## Plan de trabajo

### Roles y responsabilidades
| Rol                | Integrante        | Tareas principales |
|--------------------|-------------------|-------------------|
| Frontend           | Emiliano Urruti   | Estructura HTML, estilos CSS, catálogo y carrito |
| Documentación      | Lucía Rodríguez   | Informe, bitácora, entrevistas, diagramas |
| Testing y soporte  | Jonathan Pereira  | Revisión de prototipo, pruebas de usabilidad, apoyo en documentación |

### Tareas por fase
| Fase | Tarea                                     | Responsable      |
|------|-------------------------------------------|------------------|
| Fase 1 | Organizar carpetas, subir repo           | Emiliano Urruti |
| Fase 1 | Redactar entrevistas y requerimientos    | Lucía Rodríguez |
| Fase 1 | Bitácora y README                        | Jonathan Pereira |
| Fase 2 | Diagramas MER y Secuencia                | Lucía Rodríguez |
| Fase 2 | Ajustar estilos y navegación del prototipo | Emiliano Urruti |
| Fase 3 | Pruebas y feedback                       | Jonathan Pereira |

### Cronograma (mini Gantt)
| Semana | Actividad |
|--------|-----------|
| 1 | Organización del proyecto y repositorio |
| 2 | Relevamiento: entrevistas y requerimientos |
| 3 | Diagramas MER y Secuencia |
| 4 | Ajustes finales del prototipo y entrega |

---

## Conclusiones y próximos pasos
La primera entrega permitió definir la estructura del proyecto, documentar los objetivos y requerimientos iniciales, y presentar un prototipo navegable con catálogo y carrito básico.  
Se estableció el modelo de datos y el flujo principal de interacción entre el cliente y la aplicación.

**Próximas etapas:**
- Completar entrevistas reales y refinar requerimientos.
- Implementar la base de datos y el backend para gestionar productos y pedidos.
- Integrar la base con el frontend y agregar autenticación de usuarios.
- Mejorar usabilidad y accesibilidad según pruebas con usuarios.
