<?php 
ini_set('display_errors',1); 
error_reporting(E_ERROR);



if (!function_exists('http_response_code')) {
    function http_response_code($code = NULL) {

        if ($code !== NULL) {

            switch ($code) {
                case 100: $text = 'Continue'; break;
                case 101: $text = 'Switching Protocols'; break;
                case 200: $text = 'OK'; break;
                case 201: $text = 'Created'; break;
                case 202: $text = 'Accepted'; break;
                case 203: $text = 'Non-Authoritative Information'; break;
                case 204: $text = 'No Content'; break;
                case 205: $text = 'Reset Content'; break;
                case 206: $text = 'Partial Content'; break;
                case 300: $text = 'Multiple Choices'; break;
                case 301: $text = 'Moved Permanently'; break;
                case 302: $text = 'Moved Temporarily'; break;
                case 303: $text = 'See Other'; break;
                case 304: $text = 'Not Modified'; break;
                case 305: $text = 'Use Proxy'; break;
                case 400: $text = 'Bad Request'; break;
                case 401: $text = 'Unauthorized'; break;
                case 402: $text = 'Payment Required'; break;
                case 403: $text = 'Forbidden'; break;
                case 404: $text = 'Not Found'; break;
                case 405: $text = 'Method Not Allowed'; break;
                case 406: $text = 'Not Acceptable'; break;
                case 407: $text = 'Proxy Authentication Required'; break;
                case 408: $text = 'Request Time-out'; break;
                case 409: $text = 'Conflict'; break;
                case 410: $text = 'Gone'; break;
                case 411: $text = 'Length Required'; break;
                case 412: $text = 'Precondition Failed'; break;
                case 413: $text = 'Request Entity Too Large'; break;
                case 414: $text = 'Request-URI Too Large'; break;
                case 415: $text = 'Unsupported Media Type'; break;
                case 500: $text = 'Internal Server Error'; break;
                case 501: $text = 'Not Implemented'; break;
                case 502: $text = 'Bad Gateway'; break;
                case 503: $text = 'Service Unavailable'; break;
                case 504: $text = 'Gateway Time-out'; break;
                case 505: $text = 'HTTP Version not supported'; break;
                default:
                    exit('Unknown http status code "' . htmlentities($code) . '"');
                break;
            }

            $protocol = (isset($_SERVER['SERVER_PROTOCOL']) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0');

            header($protocol . ' ' . $code . ' ' . $text);

            $GLOBALS['http_response_code'] = $code;

        } else {

            $code = (isset($GLOBALS['http_response_code']) ? $GLOBALS['http_response_code'] : 200);

        }

        return $code;

    }
}

// demo backend for testing frontend api
// this one will use mongo to temporarily store things
            
/**
 * gets the db client. uses apc to store last used and to flush db 
 */
class MDB {
    const APC_TIMER_FLAG = "testdbflag";
    const REFRESH_TIME_LIMIT = 600;
    
    static $client = null;
    static function link() {
        if (!self::$client) {
            self::$client = new MongoClient();
        } 
        self::refresh();
        return self::$client->testDB;
    } 
    
    // flush mongo every x min so it doesn't blow up
    static function refresh() {
        // cache the last accessed time in apc
        $flag = apc_fetch(self::APC_TIMER_FLAG);  
        
        if (!$flag || $flag > $_SERVER['REQUEST_TIME'] + self::REFRESH_TIME_LIMIT) {
            self::$client->testDB->drop();
            apc_store(self::APC_TIMER_FLAG, $_SERVER['REQUEST_TIME']);  
        }  
    }
}


class Rest_Controller {
    public $path = "";
    
    public function __construct($path) {
        $this->path = $path;
    }
    
    public function get() {
        list($collection, $id) = $this->parse_path();
        $db = MDB::link(); 
        if (!$collection) {
            http_response_code(400);
            return;
        }
        
        $table = $db->selectCollection($collection);
        $data = array();
        if ($id) {
            $cursor = $table->find(array("_id" => $id));
        }
        else {
            $cursor = $table->find();
        }     
                
        foreach($cursor AS $doc) {
            $data[] = $doc;
        }
        
        $data = array_map( function($item){
            if ($item['_id']) {
                $item['id'] = $item['_id'];
                unset($item['_id']);
            }
            return $item;
        }, $data);
        
        if (empty($data)) $data = array();
        
        echo json_encode( $id ? $data[0] : $data );
        
    } 
    
    // new
    public function post() {
        list($collection, $id) = $this->parse_path();
        $db = MDB::link(); 
        
        if (!$collection || $id) {
            http_response_code(400);
            return;
        }
        $table = $db->selectCollection($collection);
        $request_body = file_get_contents('php://input');
        $data = json_decode( $request_body , true ); 
        
        $id = uniqid();
        
        $data['_id'] = $id;  
        $table->insert( $data );
        
        $data['id'] = $data['_id'];
        unset($data['_id']);
        
        echo json_encode($data); 
    }
    // update
    public function put() {
        list($collection, $id) = $this->parse_path();
        $db = MDB::link();
        
        if (!$collection || !$id) {
            http_response_code(400);
            return;
        }
        $table = $db->selectCollection($collection); 

        $request_body = file_get_contents('php://input');
        $data = json_decode( $request_body , true ); 
        
        unset($data['id']);
        $return = $table->update( array('_id' => $id), $data );
        $data['id'] = $id;
        
        echo json_encode($data); 
        
    }
    
    public function delete() {
        list($collection, $id) = $this->parse_path();
        $db = MDB::link();
        
        if (!$collection || !$id) {
            http_response_code(400);
            return;
        }
        $table = $db->selectCollection($collection);
        
        $flag = $table->remove(array(
            "_id" => $id
        ));
        
         
        http_response_code(204); 
        
    }
    
    public function parse_path() {  
        $return = array();
        $parts = array_filter(explode("/", $this->path));
        // $parts[1] is the /api/ 
        $collection = $parts[2];
        $id = $parts[3];

        if (!$collection) return array();

        return array(
            $collection, $id
        );
    }
    
    
    public function run( $method ) {
        $method = strtolower($method); 
        switch($method) {
            case "get" : 
                $this->get();
                break;
            case "put" : 
                $this->put();
                break;
            case "post" : 
                $this->post();
                break;
            case "delete" : 
                $this->delete();
                break;
            default:
                http_response_code(400);
                break;
            
        }
    }
    
}
            
$controller = new Rest_Controller( $_SERVER['REQUEST_URI'] );
$controller->run($_SERVER['REQUEST_METHOD']);






