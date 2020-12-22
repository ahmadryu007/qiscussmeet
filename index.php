<?php

require 'vendor/autoload.php';

$app = new \Slim\App();
$container = $app->getContainer();

$container['CHAT_SDK_APP_ID'] = 'kawan-seh-g857ffuuw9b';
$container['CHAT_SDK_APP_SECRET'] = 'c7f3ab87acc3843a1b81d77c2b4d6b0c';

$container['view'] = function($container) {
  return new \Slim\Views\PhpRenderer('./templates/');
};

$app->get('/', function($request, $response, $args) {
  return $this->view->render($response, 'index.phtml', [
    "CHAT_APP_ID" => $this->CHAT_SDK_APP_ID
  ]);
});
$app->get('/login', function($request, $response, $args) {
  $appId = $this->CHAT_SDK_APP_ID;
  return $this->view->render($response, 'login.phtml', [
    "CHAT_APP_ID" => $this->CHAT_SDK_APP_ID
  ]);
});
$app->post('/init_call', function($request, $response, $args) {
  $params = $request->getParams();
  $client = new \GuzzleHttp\Client();

  // send system event
  $params['room_id'] = $params['payload']['room_id'];
  $data = [
    'system_event_type' => $params['system_event_type'],
    'room_id' => (string)$params['room_id'],
    'subject_email' => $params['subject_email'],
    'message' => $params['message'],
    'payload' => [
      'type' => $params['payload']['type'],
      'room_id' => $params['room_id'],
      'call_room_id' => $params['room_id'],
      'call_event' => $params['payload']['call_event'],
      'call_url' => $params['payload']['call_url'],
      'call_caller' => [
        'username' => $params['payload']['call_caller']['username'],
        'name' => $params['payload']['call_caller']['name'],
        'avatar' => $params['payload']['call_caller']['avatar']
      ],
      'call_callee' => [
        'username' => $params['payload']['call_callee']['username'],
        'name' => $params['payload']['call_callee']['name'],
        'avatar' => $params['payload']['call_callee']['avatar']
      ]
    ]
  ];

  // var_dump($params);
  // exit;
    
  $res = $client->request('POST', 'http://' . $this->CHAT_SDK_APP_ID . '.qiscus.com/api/v2/rest/post_system_event_message', [
    'headers' => [
      'Content-Type' => 'application/json',
      'QISCUS_SDK_SECRET' => $this->CHAT_SDK_APP_SECRET
    ],
    'json' => $data
  ]);

  

  return $response->withJson(json_decode($res->getBody()));
});

$app->get('/meet/{id}', function($request, $response, $args) {
  return $this->view->render($response, 'meet.phtml', [
  ]);
});

$app->run();

?>
