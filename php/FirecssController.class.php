<?php
#  FireCSS - See CSS changes in all browsers as you edit
#  Copyright (C) 2011  Julian Cox, Webspeed Ltd.
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Manage controller for FireCSS
 * @author  Simon Leblanc <contact@leblanc-simon.eu>
 * @license http://www.gnu.org/licenses/ GNU GPL
 * @version 0.1
 * @package FireCSS
 */
class FirecssController
{
  const UPDATE = '/firecss/polling';
  const INDEX  = '/firecss';
  const DOWNLOAD  = '/firecss/download';
  
  /**
   * @var     IFirecssSession   The Firecss session
   * @access  private
   * @since   0.1
   */
  private $session = null;
  
  /**
   * @var     mixed    The datas to send
   * @access  private
   * @since   0.1
   */
  private $datas = null;
  
  /**
   * @var     string|null   The js callback to call with the datas
   * @access  private
   * @since   0.1
   */
  private $callback = null;
  
  
  /**
   * Construt the controller
   *
   * @param   IFirecssSession $session  The Firecss session
   * @return  void
   * @access  public
   * @since   0.1
   */
  public function __construct(IFirecssSession $session)
  {
    $this->session = $session;
  }
  
  
  /**
   * Index controller (call to update the styles in the server)
   *
   * @param   array   $params  The $_GET params send by Firecss addon
   * @return  FirecssController The self object to chain methods
   * @access  public
   * @since   0.1
   */
  public function index($params = array())
  {
    $mods = FirecssCache::getCache($this->session);
    $number_mods = count($mods);
    
    // Check parameters
    $parameters = array('edits', 'selectors', 'properties', 'values', 'sources', 'lines', 'timestamps');
    foreach ($parameters as $parameter) {
      if ($parameter === 'edits' && (isset($params[$parameter]) === false || is_array($params[$parameter]) === false)) {
        throw new Exception($parameter.' must be an array');
      } elseif ($parameter !== 'edits' && isset($params[$parameter]) === true && is_array($params[$parameter]) === false) {
        throw new Exception($parameter.' must be an array');
      }
      
      $$parameter = $params[$parameter];
    }
    
    // Get all changes
    foreach ($edits as $i => $edit) {
      if ((int)$edit === -1) {
        $mods = array();
        $this->datas = 'window.location.reload();';
      } else {
        $mods[] = array(
          'selector'  => $selectors[$i],
          'property'  => $properties[$i],
          'value'     => $values[$i],
          'source'    => $sources[$i],
          'line'      => (float)$lines[$i],
          'timestamp' => (int)$timestamps[$i],
          'edit'      => $number_mods + $i,
          'client'    => $this->session->getId()
        );
      }
    }
    
    FirecssCache::setCache($mods, $this->session);
    
    return $this;
  }
  
  
  /**
   * Update controller (call to update the styles in the browser)
   *
   * @param   array   $params  The $_GET params send by Firecss addon
   * @return  FirecssController The self object to chain methods
   * @access  public
   * @since   0.1
   */
  public function update($params = array())
  {
    $mods = FirecssCache::getCache($this->session);
    $number_mods = count($mods);
    
    if (isset($params['edit']) === false) {
      $from = 0;
    } else {
      $from = (int)$params['edit'] + 1;
    }
    
    if ($from > $number_mods) {
      $this->datas = 'reload';
    } else {
      $updates = array_slice($mods, $from, $number_mods);
      
      /*foreach ($updates as $i => $u) {
        if ($u['client'] == $this->session->getId()) {
          $u['selector'] = null;
          $updates[$i] = $u;
        }
      }*/
      
      if (count($updates) > 0) {
        $this->datas = $updates;
      }
      
      // if acallback is send, use it for the response
      if (isset($params['callback']) === true && empty($params['callback']) === false) {
        $this->callback = $params['callback'];
      }
    }
    
    return $this;
  }
  
  
  /**
   * Download controller (call to download styles editing)
   *
   * @param   array   $params  The $_POST params send by Firecss addon
   * @return  FirecssController The self object to chain methods
   * @access  public
   * @since   0.1
   * @todo    code the method :-)
   */
  public function download($params = array())
  {
    return $this;
  }
  
  
  /**
   * Get the controller name to execute
   *
   * @return  string    The name of the controller to execute
   * @access  public
   * @since   0.1
   */
  public function getName()
  {
    $uri = strtok($_SERVER['REQUEST_URI'], '?');
    if (substr($uri, -1) === '/') {
      $uri = substr($uri, 0, -1);
    }
    
    if (substr($uri, -1 * strlen(FirecssController::INDEX)) === FirecssController::INDEX) {
      return 'index';
    }
    
    if (substr($uri, -1 * strlen(FirecssController::UPDATE)) === FirecssController::UPDATE) {
      return 'update';
    }
    
    if (substr($uri, -1 * strlen(FirecssController::DOWNLOAD)) === FirecssController::DOWNLOAD) {
      return 'download';
    }
    
    throw new Exception('The action doesn\'t exists');
  }
  
  
  /**
   * Get the vars according to the controller name
   *
   * @return  array    The parameters to use
   * @access  public
   * @since   0.1
   */
  public function getRequestVar()
  {
    $name = $this->getName();
    
    if ($name === 'download') {
      return $_POST;
    } else {
      return $_GET;
    }
    
    throw new Exception('The action doesn\'t exists');
  }
  
  
  /**
   * Send the datas in the browser
   *
   * @return  void
   * @access  public
   * @since   0.1
   */
  public function run()
  {
    if ($this->datas === null) {
      header("HTTP/1.0 204 No Content");
      header('Content-Length: 0', true);
      header('Content-Type: text/html', true);
      flush();
      exit;
    }
    
    $datas = json_encode($this->datas);
    if ($this->callback !== null) {
      $datas = $this->callback.'('.$datas.');';
    }
    header("HTTP/1.0 200 OK");
    header('Content-Length: '.mb_strlen($datas), true);
    header('Content-Type: application/json', true);
    die($datas);
  }
}