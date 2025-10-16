<?php
// backend/api.php
session_start();
require __DIR__ . '/db.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

switch ($action) {
  case 'list_categorias':
    $rows = $pdo->query("SELECT id, nombre, slug FROM categorias ORDER BY nombre")->fetchAll();
    json_out($rows);
    break;

  case 'list_productos':
    $params = [];
    $sql = "SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagen,
                   c.slug AS categoria
            FROM productos p
            JOIN categorias c ON c.id = p.categoria_id
            WHERE p.activo = 1";
    if (!empty($_GET['categoria'])) {
      $sql .= " AND c.slug = :cat";
      $params[':cat'] = $_GET['categoria'];
    }
    if (!empty($_GET['q'])) {
      $sql .= " AND p.nombre LIKE :q";
      $params[':q'] = "%".$_GET['q']."%";
    }
    $sql .= " ORDER BY p.nombre";
    $stm = $pdo->prepare($sql);
    $stm->execute($params);
    json_out($stm->fetchAll());
    break;

  /* ---- Carrito en sesión ---- */
  case 'carrito_get':
    $cart = $_SESSION['cart'] ?? [];
    json_out(['items'=>$cart, 'total'=>array_sum(array_map(fn($i)=>$i['precio']*$i['cantidad'],$cart))]);
    break;

  case 'carrito_add':
    $id  = (int)($_POST['producto_id'] ?? 0);
    $qty = max(1, (int)($_POST['cantidad'] ?? 1));
    $stm = $pdo->prepare("SELECT id, nombre, precio FROM productos WHERE id = :id AND activo = 1");
    $stm->execute([':id'=>$id]);
    $p = $stm->fetch();
    if(!$p) json_out(['error'=>'Producto no encontrado'], 404);

    $_SESSION['cart'] = $_SESSION['cart'] ?? [];
    if(!isset($_SESSION['cart'][$id])){
      $_SESSION['cart'][$id] = ['id'=>$p['id'],'nombre'=>$p['nombre'],'precio'=>(float)$p['precio'],'cantidad'=>0];
    }
    $_SESSION['cart'][$id]['cantidad'] += $qty;
    json_out(['ok'=>true, 'item'=>$_SESSION['cart'][$id]]);
    break;

  case 'carrito_remove':
    $id = (int)($_POST['producto_id'] ?? 0);
    if(isset($_SESSION['cart'][$id])) unset($_SESSION['cart'][$id]);
    json_out(['ok'=>true]);
    break;

  case 'carrito_clear':
    $_SESSION['cart'] = [];
    json_out(['ok'=>true]);
    break;

  /* ---- Crear pedido (simulación de checkout) ---- */
  case 'pedido_crear':
    $nombre   = trim($_POST['nombre']   ?? '');
    $email    = trim($_POST['email']    ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $direccion= trim($_POST['direccion']?? '');
    $cart     = $_SESSION['cart'] ?? [];

    if(!$nombre || !$email || empty($cart)) json_out(['error'=>'Datos insuficientes o carrito vacío'], 400);

    // crear carrito persistido
    $pdo->beginTransaction();
    $pdo->exec("INSERT INTO carritos (estado) VALUES ('cerrado')");
    $carrito_id = (int)$pdo->lastInsertId();

    $total = 0;
    foreach($cart as $it){
      $total += $it['precio'] * $it['cantidad'];
      $stm = $pdo->prepare("INSERT INTO carrito_items (carrito_id, producto_id, cantidad, precio_unit)
                            VALUES (:c,:p,:q,:u)");
      $stm->execute([
        ':c'=>$carrito_id, ':p'=>$it['id'], ':q'=>$it['cantidad'], ':u'=>$it['precio']
      ]);
    }

    // crear pedido
    $stm = $pdo->prepare("INSERT INTO pedidos
      (carrito_id, usuario_id, nombre, email, telefono, direccion, total, estado)
      VALUES (:c, NULL, :n, :e, :t, :d, :tot, 'recibido')");
    $stm->execute([
      ':c'=>$carrito_id, ':n'=>$nombre, ':e'=>$email, ':t'=>$telefono,
      ':d'=>$direccion, ':tot'=>$total
    ]);
    $pedido_id = (int)$pdo->lastInsertId();

    // duplicado de items
    $stmIns = $pdo->prepare("INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unit)
                             VALUES (:p,:pr,:q,:u)");
    foreach($cart as $it){
      $stmIns->execute([
        ':p'=>$pedido_id, ':pr'=>$it['id'],
        ':q'=>$it['cantidad'], ':u'=>$it['precio']
      ]);
    }

    $pdo->commit();
    // limpiar carrito de sesión
    $_SESSION['cart'] = [];

    json_out(['ok'=>true,'pedido_id'=>$pedido_id,'total'=>$total]);
    break;

  default:
    json_out(['error'=>'Acción no soportada','acciones'=>[
      'list_categorias','list_productos','carrito_get','carrito_add',
      'carrito_remove','carrito_clear','pedido_crear'
    ]], 400);
}
