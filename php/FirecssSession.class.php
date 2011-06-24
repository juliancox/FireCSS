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
 * Manage session for FireCSS
 * @author  Simon Leblanc <contact@leblanc-simon.eu>
 * @license http://www.gnu.org/licenses/ GNU GPL
 * @version 0.1
 * @package FireCSS
 */
class FirecssSession implements IFirecssSession
{
  /**
   * @var     string  The session id
   * @access  private
   * @since   0.1
   */
  private $session_id = null;
  
  /**
   * Construct the FireCSS session
   * 
   * @return  void
   * @access  public
   * @since   0.1
   */
  public function __construct()
  {
    // Build session identifier
    $this->init();
  }
  
  
  /**
   * Return the session id
   *
   * @return  string    The session id
   * @access  public
   * @since   0.1
   */
  public function getId()
  {
    return $this->session_id;
  }
  
  
  /**
   * Build the session id. The session_id is composed to :
   * - HTTP_REFERER
   *
   * @return  void
   * @access  private
   * @since   0.1
   */
  private function init()
  {
    if ($this->session_id !== null) {
      return;
    }
    
    $session_string = '';
    
    if (isset($_SERVER['HTTP_REFERER']) === true && empty($_SERVER['HTTP_REFERER']) === false) {
      $session_string .= $_SERVER['HTTP_REFERER'];
    } else {
      throw new Exception('No referer !');
    }
    
    $this->session_id = md5($session_string);
  }
}