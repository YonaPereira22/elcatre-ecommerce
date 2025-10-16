<?php
// backend/api.php — El Catre S.R.L.
session_start();
require __DIR__ . '/db.php';

/* ===== CONFIG GOOGLE =====
   Obtené tu Client ID en https://console.cloud.google.com/apis/credentials
   y ponelo acá (debe terminar en .apps.googleusercontent.com)
*/
$GOOGLE_CLIENT_ID = 'REEMPLAZA_AQUI_TU_CLIENT_ID.apps.googleusercontent.com';

/* ---------- Helpers ---------- */
function json_out($data, $code=200){
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data);
  exit;
}
function require_fields($arr, $fields){
  foreach($fields as $f){
    if(!isset($arr[$f]) || trim($arr[$f])===''){
      json_out(['error'=>"Falta el campo: $f"], 400);
    }
  }
}
function current_user(){
  return $_SESSION['user'] ?? null;
}

/* CORS dev (si te hace falta) */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET,POST,OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

/* ===================== ROUTER ===================== */
switch ($action){

/************** AUTENTICACIÓN BÁSICA **************/
case 'auth_register': {
  require_fields($_POST, ['nombre','email','password']);
  $nombre = trim($_POST['nombre']); $email = trim($_POST['email']); $pass = $_POST['password'];
  if(!filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(['error'=>'Email inválido'], 400);
  if(strlen($pass)<6) json_out(['error'=>'La contraseña debe tener al menos 6 caracteres'], 400);

  $q = $pdo->prepare("SELECT id FROM usuarios WHERE email=:e LIMIT 1");
  $q->execute([':e'=>$email]); if($q->fetch()) json_out(['error'=>'Ya existe un usuario con ese email'], 409);

  $hash = password_hash($pass, PASSWORD_BCRYPT);
  $pdo->prepare("INSERT INTO usuarios (nombre,email,pass_hash,rol) VALUES (:n,:e,:h,'cliente')")
      ->execute([':n'=>$nombre,':e'=>$email,':h'=>$hash]);
  $id = (int)$pdo->lastInsertId();
  $_SESSION['user'] = ['id'=>$id,'nombre'=>$nombre,'email'=>$email,'rol'=>'cliente'];
  json_out(['ok'=>true,'user'=>$_SESSION['user']]);
}

case 'auth_login': {
  require_fields($_POST, ['email','password']);
  $email = trim($_POST['email']); $pass = $_POST['password'];
  $q = $pdo->prepare("SELECT id,nombre,email,rol,pass_hash FROM usuarios WHERE email=:e LIMIT 1");
  $q->execute([':e'=>$email]); $u=$q->fetch();
  if(!$u || !password_verify($pass,$u['pass_hash'])) json_out(['error'=>'Credenciales inválidas'], 401);
  $_SESSION['user'] = ['id'=>$u['id'],'nombre'=>$u['nombre'],'email'=>$u['email'],'rol'=>$u['rol']];
  json_out(['ok'=>true,'user'=>$_SESSION['user']]);
}

case 'auth_logout': {
  $_SESSION=[]; if (ini_get("session.use_cookies")) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time()-42000, $p["path"],$p["domain"],$p["secure"],$p["httponly"]);
  }
  session_destroy(); json_out(['ok'=>true]);
}

case 'auth_me': {
  $u=current_user(); json_out($u?['authenticated'=>true,'user'=>$u]:['authenticated'=>false]);
}

/************** LOGIN CON GOOGLE **************/
case 'auth_google': {
  // POST: id_token (Google)
  require_fields($_POST, ['id_token']);
  $idToken = $_POST['id_token'];

  // Verificación rápida contra Google (requiere internet)
  $info = @file_get_contents("https://oauth2.googleapis.com/tokeninfo?id_token=".urlencode($idToken));
  if(!$info) json_out(['error'=>'No se pudo verificar el token'], 401);
  $payload = json_decode($info, true);

  if(empty($payload['aud']) || $payload['aud'] !== $GOOGLE_CLIENT_ID){
    json_out(['error'=>'Audiencia inválida'], 401);
  }
  if(($payload['email_verified'] ?? 'false') !== 'true'){
    json_out(['error'=>'Email no verificado en Google'], 401);
  }

  $email = $payload['email'];
  $nombre = $payload['name'] ?? explode('@',$email)[0];

  // Upsert usuario
  $q = $pdo->prepare("SELECT id,nombre,email,rol FROM usuarios WHERE email=:e LIMIT 1");
  $q->execute([':e'=>$email]); $u=$q->fetch();
  if(!$u){
    $pdo->prepare("INSERT INTO usuarios (nombre,email,rol) VALUES (:n,:e,'cliente')")
        ->execute([':n'=>$nombre, ':e'=>$email]);
    $id = (int)$pdo->lastInsertId();
    $u = ['id'=>$id,'nombre'=>$nombre,'email'=>$email,'rol'=>'cliente'];
  }
  $_SESSION['user']=$u;
  json_out(['ok'=>true,'user'=>$u]);
}

/************** CATÁLOGO **************/
case 'list_categorias': {
  $rows = $pdo->query("SELECT id,nombre,slug FROM categorias ORDER BY nombre")->fetchAll();
  json_out($rows);
}
case 'list_productos': {
  $p=[]; $sql="SELECT p.id,p.nombre,p.descripcion,p.precio,p.stock,p.imagen,c.slug AS categoria
               FROM productos p JOIN categorias c ON c.id=p.categoria_id WHERE p.activo=1";
  if(!empty($_GET['categoria'])){ $sql.=" AND c.slug=:cat"; $p[':cat']=$_GET['categoria']; }
  if(!empty($_GET['q'])){ $sql.=" AND p.nombre LIKE :q"; $p[':q']="%".$_GET['q']."%"; }
  $sql.=" ORDER BY p.nombre"; $stm=$pdo->prepare($sql); $stm->execute($p); json_out($stm->fetchAll());
}

/************** CARRITO EN SESIÓN **************/
case 'carrito_get': {
  $cart = $_SESSION['cart'] ?? []; $total=0; foreach($cart as $it){ $total += $it['precio']*$it['cantidad']; }
  json_out(['items'=>$cart,'total'=>$total]);
}
case 'carrito_add': {
  $id=(int)($_POST['producto_id']??0); $qty=max(1,(int)($_POST['cantidad']??1));
  $s=$pdo->prepare("SELECT id,nombre,precio FROM productos WHERE id=:id AND activo=1"); $s->execute([':id'=>$id]); $p=$s->fetch();
  if(!$p) json_out(['error'=>'Producto no encontrado'],404);
  $_SESSION['cart']=$_SESSION['cart']??[];
  if(!isset($_SESSION['cart'][$id])) $_SESSION['cart'][$id]=['id'=>$p['id'],'nombre'=>$p['nombre'],'precio'=>(float)$p['precio'],'cantidad'=>0];
  $_SESSION['cart'][$id]['cantidad']+=$qty; json_out(['ok'=>true,'item'=>$_SESSION['cart'][$id]]);
}
case 'carrito_remove': { $id=(int)($_POST['producto_id']??0); if(isset($_SESSION['cart'][$id])) unset($_SESSION['cart'][$id]); json_out(['ok'=>true]); }
case 'carrito_clear' : { $_SESSION['cart']=[]; json_out(['ok'=>true]); }

/************** PEDIDOS **************/
case 'pedido_crear': {
  $nombre=trim($_POST['nombre']??''); $email=trim($_POST['email']??''); $tel=trim($_POST['telefono']??''); $dir=trim($_POST['direccion']??'');
  $cart=$_SESSION['cart']??[]; if(!$nombre||!$email||empty($cart)) json_out(['error'=>'Datos insuficientes o carrito vacío'],400);
  $pdo->beginTransaction();
  $pdo->exec("INSERT INTO carritos (estado) VALUES ('cerrado')"); $carrito_id=(int)$pdo->lastInsertId();
  $total=0; $ins=$pdo->prepare("INSERT INTO carrito_items (carrito_id,producto_id,cantidad,precio_unit) VALUES (:c,:p,:q,:u)");
  foreach($cart as $it){ $total += $it['precio']*$it['cantidad']; $ins->execute([':c'=>$carrito_id,':p'=>$it['id'],':q'=>$it['cantidad'],':u'=>$it['precio']]); }
  $uid=current_user()['id']??null;
  $pdo->prepare("INSERT INTO pedidos (carrito_id,usuario_id,nombre,email,telefono,direccion,total,estado)
                 VALUES (:c,:u,:n,:e,:t,:d,:tot,'recibido')")
      ->execute([':c'=>$carrito_id,':u'=>$uid,':n'=>$nombre,':e'=>$email,':t'=>$tel,':d'=>$dir,':tot'=>$total]);
  $pedido_id=(int)$pdo->lastInsertId();
  $pis=$pdo->prepare("INSERT INTO pedido_items (pedido_id,producto_id,cantidad,precio_unit) VALUES (:p,:pr,:q,:u)");
  foreach($cart as $it){ $pis->execute([':p'=>$pedido_id,':pr'=>$it['id'],':q'=>$it['cantidad'],':u'=>$it['precio']]); }
  $pdo->commit(); $_SESSION['cart']=[];
  json_out(['ok'=>true,'pedido_id'=>$pedido_id,'total'=>$total]);
}

/************** DEFAULT **************/
default:
  json_out(['error'=>'Acción no soportada'],400);
}

